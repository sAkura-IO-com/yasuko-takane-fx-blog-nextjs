import { getConfig } from "@/lib/config";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function interpretIndexNowStatus(
  status: number,
): "ok" | "retry-429" | "fatal" | "retry" {
  if (status >= 200 && status < 300) return "ok";
  if (status === 202) return "ok";
  if (status === 429) return "retry-429";
  if (status >= 400 && status < 500) return "fatal";
  return "retry";
}

function throwForIndexNowStatus(status: number, urls: string[]): void {
  const kind = interpretIndexNowStatus(status);
  const detail = `${status} ${urls.join(", ")}`;
  if (kind === "ok") return;
  if (kind === "fatal") {
    throw new Error(`[indexnow] 提交未受理: ${detail}`);
  }
  throw new Error(`[indexnow] 提交失败: ${detail}`);
}

export async function submitToIndexNowOrThrow(urls: string[]): Promise<void> {
  const key = (await getConfig("seo.indexnow_key")).trim();
  if (!key || urls.length === 0) return;

  const host = new URL(urls[0]!).host;
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, urlList: urls }),
    signal: AbortSignal.timeout(5000),
  });
  throwForIndexNowStatus(response.status, urls);
}
