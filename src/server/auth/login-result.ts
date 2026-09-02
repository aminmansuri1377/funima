import type { UserRole } from "@/generated/prisma/client";

import { getRoleHome } from "@/server/auth/routes";

export type LoginResult = {
  success: true;
  redirectTo: string;
};

export function createLoginResult(activeRole: UserRole): LoginResult {
  return {
    success: true,
    redirectTo: getRoleHome(activeRole),
  };
}
