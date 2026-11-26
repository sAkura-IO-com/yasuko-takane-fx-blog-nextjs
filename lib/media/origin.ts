export function mediaOrigin(): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}
