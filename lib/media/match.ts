const KNOWN_PREFIXES = ["library/", "avatars/", "files/"] as const;

const REF_PATTERN =
  /https?:\/\/[^\s"'<>\\)]+|\/\/[^\s"'<>\\)]+|(?<![\w.-])(?:library|avatars|files)\/[^\s"'<>\\)?#]+/gi;

const TRAILING_PUNCTUATION = /[.,;:!?，。、）)]+$/u;

export type MediaRef = { key: string; url: string };

export type MediaUsedInput = Iterable<string> | ((media: MediaRef) => boolean);

export function mediaMatchKey(value: string): string {
  const trimmed = value.trim().replace(/&amp;/gi, "&");
  if (!trimmed) return "";

  const withoutHash = trimmed.split("#", 1)[0] ?? trimmed;
  if (/^(https?:)?\/\//i.test(withoutHash)) {
    try {
      const absolute = withoutHash.startsWith("//")
        ? `https:${withoutHash}`
        : withoutHash;
      const url = new URL(absolute);
      const key = extractKnownKey(decodePath(url.pathname));
      if (key) return key;
      const path = decodePath(url.pathname).replace(/\/+$/, "");
      return `${url.host}${path}`;
    } catch {}
  }

  const withoutQuery = withoutHash.split("?", 1)[0] ?? withoutHash;
  const decoded = decodePath(withoutQuery);
  const key = extractKnownKey(decoded);
  if (key) return key;
  return decoded.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function collectMediaRefs(text: string): string[] {
  if (!text) return [];
  const refs: string[] = [];
  for (const match of text.matchAll(REF_PATTERN)) {
    const value = match[0].replace(TRAILING_PUNCTUATION, "");
    if (value) refs.push(value);
  }
  return refs;
}

export function mediaIdentitySet(used: Iterable<string>): Set<string> {
  const identities = new Set<string>();
  for (const item of used) {
    const id = mediaMatchKey(item);
    if (id) identities.add(id);
  }
  return identities;
}

export function isMediaUsed(media: MediaRef, used: Iterable<string>): boolean {
  return matchesIdentity(media, mediaIdentitySet(used));
}

export function resolveMediaUsed(
  used: MediaUsedInput | undefined,
): (media: MediaRef) => boolean {
  if (!used) return () => false;
  if (typeof used === "function") return used;
  const identities = mediaIdentitySet(used);
  return (media) => matchesIdentity(media, identities);
}

function matchesIdentity(
  media: MediaRef,
  identities: ReadonlySet<string>,
): boolean {
  if (identities.size === 0) return false;
  const keyId = mediaMatchKey(media.key);
  if (keyId && identities.has(keyId)) return true;
  const urlId = mediaMatchKey(media.url);
  return Boolean(urlId && identities.has(urlId));
}

function decodePath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractKnownKey(path: string): string | null {
  const normalized = path.replace(/\\/g, "/");
  for (const prefix of KNOWN_PREFIXES) {
    let from = 0;
    while (from < normalized.length) {
      const at = normalized.indexOf(prefix, from);
      if (at < 0) break;
      const boundary = at === 0 || normalized[at - 1] === "/";
      if (boundary) {
        const key = normalized.slice(at).replace(/\/+$/, "");
        if (!key || key.includes("..")) return null;
        return key;
      }
      from = at + prefix.length;
    }
  }
  return null;
}
