import { createAuth, envAuthConfig } from "./auth-factory";

/**
 * 仅供 `pnpm auth:generate` 与客户端类型推断使用：只读环境变量，
 * 不访问数据库配置。应用运行时请用 lib/better-auth/runtime.ts 的 getAuth()。
 */
export const auth = createAuth(envAuthConfig());
