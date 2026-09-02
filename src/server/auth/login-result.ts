import type { AuthRole } from "@/lib/auth/roles";

import { getRoleHome } from "@/lib/auth/routes";

export type LoginResult = {
  success: true;
  redirectTo: string;
};

export function createLoginResult(activeRole: AuthRole): LoginResult {
  return {
    success: true,
    redirectTo: getRoleHome(activeRole),
  };
}
