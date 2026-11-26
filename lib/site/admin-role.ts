export function roleHasAdmin(role: string | null | undefined): boolean {
  return (role ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .includes("admin");
}
