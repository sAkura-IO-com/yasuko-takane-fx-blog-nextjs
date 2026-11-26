export const NICKNAME_COOKIE = "ska-nickname";

const NICKNAME_MAX_LENGTH = 40;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function readNicknameCookie(): string {
  if (typeof document === "undefined") return "";
  const prefix = `${NICKNAME_COOKIE}=`;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  if (!match) return "";
  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return "";
  }
}

export function writeNicknameCookie(value: string): void {
  if (typeof document === "undefined") return;
  const nickname = value.trim().slice(0, NICKNAME_MAX_LENGTH);
  document.cookie = nickname
    ? `${NICKNAME_COOKIE}=${encodeURIComponent(nickname)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`
    : `${NICKNAME_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
