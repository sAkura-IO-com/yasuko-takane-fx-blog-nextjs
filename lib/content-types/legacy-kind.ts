export function legacyPostKind(typeKey: string | null | undefined) {
  if (typeKey === "article" || typeKey === "note") return typeKey;
  return null;
}
