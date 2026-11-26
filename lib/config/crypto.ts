import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const PREFIX = "enc:v1:";

function masterKey(): Buffer | null {
  const raw = process.env.CONFIG_MASTER_KEY?.trim();
  if (!raw) return null;
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plain: string): string {
  const key = masterKey();
  if (!key) throw new Error("缺少 CONFIG_MASTER_KEY，无法加密敏感配置");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "enc",
    "v1",
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptSecret(stored: string): string | null {
  if (!stored.startsWith(PREFIX)) return stored;
  const parts = stored.split(":");
  if (parts.length !== 5) return null;
  const key = masterKey();
  if (!key) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(parts[2]!, "base64"),
    );
    decipher.setAuthTag(Buffer.from(parts[3]!, "base64"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(parts[4]!, "base64")),
      decipher.final(),
    ]);
    return plain.toString("utf8");
  } catch (error) {
    console.error("[config] 敏感配置解密失败（主密钥是否变更？）:", error);
    return null;
  }
}
