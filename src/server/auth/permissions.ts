import type { UserRole } from "@/generated/prisma/client";

export function hasActiveRole(
  activeRole: UserRole | undefined,
  requiredRole: UserRole,
) {
  return activeRole === requiredRole;
}
