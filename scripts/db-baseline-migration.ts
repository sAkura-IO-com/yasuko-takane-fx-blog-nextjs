/**
 * 迁移记录对齐（baseline）工具：把「数据库里已经存在的改动」补记为已应用。
 *
 * 背景：开发库若长期用 `drizzle-kit push` 同步 schema，push 不会写迁移记录，
 * 之后切回 `drizzle-kit migrate` 就会在 CREATE TYPE / CREATE TABLE 上撞到
 * `type "xxx" already exists`（42710）或 `relation "xxx" already exists`（42P07）。
 *
 * 用法：
 *   pnpm db:dev:baseline                        # 只体检，不写库
 *   pnpm db:dev:baseline -- --apply             # 把所有未记录的迁移补记为已应用
 *   pnpm db:dev:baseline -- --apply --only 20260910120744_keen_wild_pack
 *   pnpm db:dev:baseline -- --apply --up-to 20260910120744_keen_wild_pack
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";
const MIGRATIONS_FOLDER = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "drizzle",
);
const BREAKPOINT = "--> statement-breakpoint";

/** drizzle-orm 只按文件夹名（name）判断迁移是否已应用 */
type LocalMigration = {
  name: string;
  hash: string;
  folderMillis: number;
  statements: string[];
};

type DbMigration = {
  id: number;
  name: string | null;
  created_at: string | null;
  applied_at: string | null;
};

type ObjectRef = {
  kind: "type" | "table" | "index" | "column" | "constraint";
  name: string;
  table?: string;
};

type Conflict = {
  statement: string;
  detail: string;
};

const USAGE = `迁移记录对齐（baseline）工具

用法：
  pnpm db:dev:baseline [选项]

选项：
  --apply              写入迁移记录（默认只体检，不写库）
  --only <文件夹名>    只处理指定的一个迁移
  --up-to <文件夹名>   处理到指定迁移（含）为止
  --all-pending        体检时同时列出所有未记录迁移的冲突项
  -h, --help           显示帮助
`;

function formatToMillis(dateStr: string): number {
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = parseInt(dateStr.slice(6, 8), 10);
  const hour = parseInt(dateStr.slice(8, 10), 10);
  const minute = parseInt(dateStr.slice(10, 12), 10);
  const second = parseInt(dateStr.slice(12, 14), 10);
  return Date.UTC(year, month, day, hour, minute, second);
}

/** 与 drizzle-orm readMigrationFiles 保持一致：按文件夹名排序、hash 为 sql 文件内容的 sha256 */
function readLocalMigrations(): LocalMigration[] {
  return readdirSync(MIGRATIONS_FOLDER)
    .filter((dir) => existsSync(join(MIGRATIONS_FOLDER, dir, "migration.sql")))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const sql = readFileSync(
        join(MIGRATIONS_FOLDER, name, "migration.sql"),
        "utf8",
      );
      return {
        name,
        hash: createHash("sha256").update(sql).digest("hex"),
        folderMillis: formatToMillis(name.slice(0, 14)),
        statements: sql.split(BREAKPOINT),
      };
    });
}

function parseArgs(argv: string[]) {
  const parsed: {
    apply: boolean;
    only?: string;
    upTo?: string;
    allPending: boolean;
  } = { apply: false, allPending: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") parsed.apply = true;
    else if (arg === "--all-pending") parsed.allPending = true;
    else if (arg === "--only") parsed.only = argv[++i];
    else if (arg === "--up-to") parsed.upTo = argv[++i];
    else if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else {
      console.error(`未知参数：${arg}\n\n${USAGE}`);
      process.exit(1);
    }
  }
  return parsed;
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "(无法解析的 DATABASE_URL)";
  }
}

/** 从语句里提取「创建/删除的对象」，用于判断该改动是否已存在于库中 */
function extractObjectRefs(statement: string): ObjectRef[] {
  const sql = statement.trim().replace(/;$/, "");

  const type = /^CREATE TYPE "([^"]+)"/.exec(sql);
  if (type) return [{ kind: "type", name: type[1] }];

  const table = /^CREATE TABLE "([^"]+)"/.exec(sql);
  if (table) return [{ kind: "table", name: table[1] }];

  const index = /^CREATE (?:UNIQUE )?INDEX "([^"]+)"/.exec(sql);
  if (index) return [{ kind: "index", name: index[1] }];

  const column = /^ALTER TABLE "([^"]+)" ADD COLUMN "([^"]+)"/.exec(sql);
  if (column) return [{ kind: "column", name: column[2], table: column[1] }];

  const constraint = /^ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)"/.exec(
    sql,
  );
  if (constraint) return [{ kind: "constraint", name: constraint[2] }];

  const dropTable = /^DROP TABLE (?:IF EXISTS )?"([^"]+)"/.exec(sql);
  if (dropTable) return [{ kind: "table", name: dropTable[1] }];

  return [];
}

async function objectExists(client: Client, ref: ObjectRef): Promise<boolean> {
  switch (ref.kind) {
    case "type": {
      const { rowCount } = await client.query(
        `SELECT 1 FROM pg_type t
         JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE t.typname = $1 AND n.nspname = ANY (current_schemas(false))`,
        [ref.name],
      );
      return (rowCount ?? 0) > 0;
    }
    case "table": {
      const { rowCount } = await client.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_name = $1 AND table_schema = ANY (current_schemas(false))`,
        [ref.name],
      );
      return (rowCount ?? 0) > 0;
    }
    case "index": {
      const { rowCount } = await client.query(
        `SELECT 1 FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relkind = 'i' AND c.relname = $1 AND n.nspname = ANY (current_schemas(false))`,
        [ref.name],
      );
      return (rowCount ?? 0) > 0;
    }
    case "column": {
      const { rowCount } = await client.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = $1 AND column_name = $2
           AND table_schema = ANY (current_schemas(false))`,
        [ref.table, ref.name],
      );
      return (rowCount ?? 0) > 0;
    }
    case "constraint": {
      const { rowCount } = await client.query(
        `SELECT 1 FROM pg_constraint WHERE conname = $1`,
        [ref.name],
      );
      return (rowCount ?? 0) > 0;
    }
  }
}

/**
 * 判断一个迁移「是否已经实际生效」：
 * 新建对象已存在 → 冲突；DROP 的对象已不存在 → 冲突。
 */
async function findConflicts(
  client: Client,
  migration: LocalMigration,
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  for (const statement of migration.statements) {
    const refs = extractObjectRefs(statement);
    for (const ref of refs) {
      const exists = await objectExists(client, ref);
      const isDrop = statement.trim().startsWith("DROP ");
      const label = ref.table ? `${ref.table}.${ref.name}` : ref.name;

      if (!isDrop && exists) {
        conflicts.push({
          statement: statement.trim(),
          detail: `${ref.kind} "${label}" 已存在（该改动已在库中生效）`,
        });
      } else if (isDrop && !exists) {
        conflicts.push({
          statement: statement.trim(),
          detail: `${ref.kind} "${label}" 已不存在（该改动已在库中生效）`,
        });
      }
    }
  }

  return conflicts;
}

async function ensureMigrationsTable(client: Client) {
  const { rows } = await client.query<{ column_name: string }>(
    `SELECT a.attname AS column_name
     FROM pg_catalog.pg_attribute a
     JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
     JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     WHERE a.attnum > 0 AND NOT a.attisdropped
       AND n.nspname = $1 AND c.relname = $2`,
    [MIGRATIONS_SCHEMA, MIGRATIONS_TABLE],
  );

  if (rows.length === 0) return { exists: false, hasNameColumn: false };

  await client.query(`CREATE SCHEMA IF NOT EXISTS ${MIGRATIONS_SCHEMA}`);
  return {
    exists: true,
    hasNameColumn: rows.some((row) => row.column_name === "name"),
  };
}

async function readDbMigrations(client: Client): Promise<DbMigration[]> {
  const { rows } = await client.query<DbMigration>(
    `SELECT id, name, created_at, applied_at FROM ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} ORDER BY id ASC`,
  );
  return rows;
}

function splitPending(
  localMigrations: LocalMigration[],
  dbMigrations: DbMigration[],
): { applied: Set<string>; pending: LocalMigration[] } {
  const applied = new Set(
    dbMigrations
      .map((row) => row.name)
      .filter((name): name is string => name !== null),
  );
  return {
    applied,
    pending: localMigrations.filter(
      (migration) => !applied.has(migration.name),
    ),
  };
}

function selectTargets(
  pending: LocalMigration[],
  options: { only?: string; upTo?: string },
): LocalMigration[] {
  if (options.only) {
    const target = pending.find((migration) => migration.name === options.only);
    if (!target) {
      console.error(`--only ${options.only} 不是未记录的迁移，无需处理`);
      process.exit(1);
    }
    return [target];
  }

  if (options.upTo) {
    const index = pending.findIndex(
      (migration) => migration.name === options.upTo,
    );
    if (index === -1) {
      console.error(`--up-to ${options.upTo} 不在未记录的迁移列表里`);
      process.exit(1);
    }
    return pending.slice(0, index + 1);
  }

  return pending;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl)
    throw new Error("缺少 DATABASE_URL，请使用 --env-file=.env 运行");

  const localMigrations = readLocalMigrations();
  if (localMigrations.length === 0)
    throw new Error(`没有找到本地迁移：${MIGRATIONS_FOLDER}`);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    console.log(`数据库：${maskUrl(databaseUrl)}`);
    console.log(
      `迁移目录：${MIGRATIONS_FOLDER}（${localMigrations.length} 个）\n`,
    );

    const table = await ensureMigrationsTable(client);
    if (table.exists && !table.hasNameColumn) {
      throw new Error(
        `迁移记录表还是旧结构（没有 name 列）。请先跑一次 pnpm db:dev:migrate 让 drizzle-orm 自动升级表结构后再重试`,
      );
    }

    const dbMigrations = table.exists ? await readDbMigrations(client) : [];
    const { applied, pending } = splitPending(localMigrations, dbMigrations);

    console.log(`已记录：${applied.size} 条，未记录：${pending.length} 条\n`);
    console.log("本地迁移：");
    for (const migration of localMigrations) {
      console.log(
        `  ${applied.has(migration.name) ? "✅" : "⏳"} ${migration.name}`,
      );
    }

    const known = new Set(localMigrations.map((migration) => migration.name));
    const orphans = dbMigrations.filter(
      (row) => !row.name || !known.has(row.name),
    );
    if (orphans.length > 0) {
      console.log(
        "\n⚠️  库里有本地不存在的迁移记录（说明有人执行过你没有的迁移，先 pull）：",
      );
      for (const orphan of orphans) {
        console.log(
          `  #${orphan.id} ${orphan.name ?? "(name 为空)"} applied_at=${orphan.applied_at ?? "-"}`,
        );
      }
    }

    if (pending.length === 0) {
      console.log("\n本地迁移全部已记录，没有需要对齐的内容。");
      return;
    }

    console.log("\n未记录的迁移体检（冲突项说明该改动其实已在库中生效）：");
    for (const migration of pending) {
      const conflicts = await findConflicts(client, migration);
      if (conflicts.length === 0) {
        console.log(`  ⏳ ${migration.name}：未生效，应交由 migrate 正常执行`);
      } else {
        console.log(
          `  ⏳ ${migration.name}：已生效（${conflicts.length} 项冲突），应补记 baseline`,
        );
        for (const conflict of conflicts) {
          console.log(`       - ${conflict.detail}`);
        }
      }
    }

    if (!options.apply) {
      console.log("\n以上为只读体检结果。确认无误后执行：");
      console.log("  pnpm db:dev:baseline -- --apply");
      return;
    }

    const targets = selectTargets(pending, options);
    if (targets.length === 0) {
      console.log("\n没有需要补记的迁移。");
      return;
    }

    console.log("\n将补记为已应用：");
    for (const target of targets) console.log(`  ${target.name}`);

    await client.query("BEGIN");
    try {
      let inserted = 0;
      for (const target of targets) {
        const { rowCount } = await client.query(
          `INSERT INTO ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} ("hash", "created_at", "name")
           SELECT $1, $2, $3
           WHERE NOT EXISTS (
             SELECT 1 FROM ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} WHERE "name" = $3
           )`,
          [target.hash, target.folderMillis, target.name],
        );
        inserted += rowCount ?? 0;
      }
      await client.query("COMMIT");
      console.log(`\n完成，补记 ${inserted} 条。下一步：pnpm db:dev:migrate`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    await client.end();
  }
}

await main();
