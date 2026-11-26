import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

/**
 * 把 monaco-editor 的 AMD 静态资源按需拷贝到 public/monaco/vs（由 postinstall 自动执行），
 * 编辑器从同源加载，不依赖 CDN。
 *
 * min/vs 里混有大量本项目用不到的文件（约占总体积 2/3）：约 90 种语言的语法高亮、
 * ts/css/html/json 四个语言服务的 worker 与 mode（language/ 目录）、多种备用入口垫片。
 * 因此不整包复制，而是解析 vs/editor/editor.main 的 AMD define() 依赖闭包，
 * 只保留运行时真正会加载的模块。依赖闭包覆盖不到的"字符串引用"文件手动补充：
 * - assets/editor.worker / assets/editorWebWorkerMain：worker 的实例化入口（new Worker URL）
 * - markdown 语法高亮：basic-languages 按语言 ID 懒加载，本项目只编辑 markdown
 * - editor/editor.main.css：运行时动态插入 <link>
 * 注意：升级 monaco 后带 hash 的文件名会变，本脚本按依赖图动态解析，无需维护清单。
 * 语言包原文件是不带 define 的普通脚本，而 vscode 的 AMD loader 不会解析
 * 普通脚本依赖（会永久挂起），因此拷贝后要包一层 define 使其成为 AMD 模块。
 */
const src = "node_modules/monaco-editor/min/vs";
const dest = "public/monaco/vs";

type ModuleDeps = string[];

/** 扫描源目录所有 AMD 模块：模块名 -> define() 声明的依赖 */
function scanModules(): Map<string, ModuleDeps> {
  const modules = new Map<string, ModuleDeps>();
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.name.endsWith(".js")) continue;
      const head = readFileSync(path, "utf8").slice(0, 2000);
      const match = head.match(/define\(\s*"([^"]+)"\s*,\s*\[([^\]]*)\]/);
      if (!match) continue;
      const deps = match[2]
        .split(",")
        .map((d) => d.trim().replace(/^["']|["']$/g, ""))
        .filter(
          (d) => d && d !== "exports" && d !== "module" && d !== "require",
        )
        .map((d) =>
          d.startsWith(".")
            ? resolveRelative(match[1], d)
            : d.replace(/!$/, ""),
        );
      modules.set(match[1], deps);
    }
  }
  walk(src);
  return modules;
}

/** 把模块 fromName 内的相对依赖（./x、../x）解析为绝对模块名 */
function resolveRelative(fromName: string, dep: string): string {
  const parts = fromName.split("/");
  parts.pop();
  for (const seg of dep.split("/")) {
    if (seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

/** 从入口模块出发求静态可达闭包 */
function closureOf(
  entries: string[],
  modules: Map<string, ModuleDeps>,
): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const name = queue.shift()!;
    if (seen.has(name) || !modules.has(name)) continue;
    seen.add(name);
    queue.push(...modules.get(name)!);
  }
  return seen;
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

const modules = scanModules();
const closure = closureOf(
  ["vs/editor/editor.main", "vs/nls.messages-loader"],
  modules,
);

// 依赖闭包对应到源文件路径（模块名 "vs/x/y" -> 文件 x/y.js）
const keep = new Set<string>(
  [...closure].map((name) => name.slice("vs/".length) + ".js"),
);
// 字符串引用、依赖图之外的运行时文件（loader.js 由 @monaco-editor/react 以 <script> 直接加载）
for (const pattern of [
  "loader.js",
  "editor/editor.main.css",
  "nls/lang/zh-cn.js",
])
  keep.add(pattern);
for (const file of readdirSync(join(src, "assets"))) {
  if (/^(editor\.worker|editorWebWorkerMain)-/.test(file))
    keep.add(`assets/${file}`);
}
// basic-languages 语法高亮按语言 ID 懒加载，只保留 markdown
for (const file of readdirSync(src)) {
  if (/^markdown-.*\.js$/.test(file)) keep.add(file);
}

let keptCount = 0;
cpSync(src, dest, {
  recursive: true,
  filter: (source) => {
    // 目录放行，只过滤文件
    const relative = source.slice(src.length);
    if (!relative.includes(".")) return true;
    if (keep.has(relative.slice(1))) {
      keptCount++;
      return true;
    }
    return false;
  },
});
console.log(
  `copy-monaco: 保留 ${keptCount} 个文件（monaco min/vs 共约 118+ 个）`,
);

const zhCn = `${dest}/nls/lang/zh-cn.js`;
const body = readFileSync(zhCn, "utf8");
writeFileSync(
  zhCn,
  `define("vs/nls/lang/zh-cn", function () {\n${body}\n});\n`,
);
