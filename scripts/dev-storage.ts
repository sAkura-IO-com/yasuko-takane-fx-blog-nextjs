import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

if (existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch {
    // 环境变量已由外部提供时忽略
  }
}

await new Promise<void>((resolve) => {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "scripts/ensure-bucket.ts"],
    { stdio: "inherit", env: process.env },
  );
  child.once("error", () => resolve());
  child.once("close", (code) => {
    if (code !== 0) {
      console.warn(
        "[storage-init] 对象存储未就绪，跳过桶初始化（媒体上传可能不可用）",
      );
    }
    resolve();
  });
});