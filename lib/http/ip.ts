export const UNKNOWN_IP = "unknown";

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

function isIpLiteral(value: string): boolean {
  if (value.length > 45) return false;
  if (IPV4.test(value)) {
    return value.split(".").every((part) => Number(part) <= 255);
  }
  return IPV6.test(value) && value.includes(":");
}

export function trustCfConnectingIp(): boolean {
  return process.env.TRUST_CF_CONNECTING_IP === "1";
}

function firstIp(value: string | null): string | undefined {
  const candidate = value?.split(",")[0]?.trim();
  return candidate && isIpLiteral(candidate) ? candidate : undefined;
}

export function clientIpFromHeaders(headers: Headers): string {
  const candidates = [
    trustCfConnectingIp() ? headers.get("cf-connecting-ip") : null,
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for"),
  ];
  for (const raw of candidates) {
    const value = firstIp(raw);
    if (value) return value;
  }
  return UNKNOWN_IP;
}
