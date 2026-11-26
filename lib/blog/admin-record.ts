import { roleHasAdmin } from "@/lib/site/admin-role";

export function isUserBanned(input: {
  banned: boolean | null | undefined;
  banExpires: Date | null | undefined;
  now?: number;
}): boolean {
  if (!input.banned) return false;
  if (!input.banExpires) return true;
  return input.banExpires.getTime() > (input.now ?? Date.now());
}

export function dbConfirmsAdmin(input: {
  userId: string;
  role: string | null | undefined;
  banned: boolean | null | undefined;
  banExpires: Date | null | undefined;
  adminUserIds?: readonly string[];
  now?: number;
}): boolean {
  if (isUserBanned(input)) return false;
  if (roleHasAdmin(input.role)) return true;
  return (input.adminUserIds ?? []).includes(input.userId);
}
