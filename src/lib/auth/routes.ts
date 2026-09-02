import type { AuthRole } from "@/lib/auth/roles";

export const AUTH_ROUTES = {
  visitor: "/auth/visitor",
  host: "/auth/host",
  admin: "/panel/login",
} as const;

export const ROLE_HOME: Record<AuthRole, string> = {
  VISITOR: "/",
  HOST: "/host",
  ADMIN: "/panel",
};

export function getRoleHome(role: AuthRole): string {
  return ROLE_HOME[role];
}

export function getAuthRoute(role: AuthRole): string {
  switch (role) {
    case "VISITOR":
      return AUTH_ROUTES.visitor;

    case "HOST":
      return AUTH_ROUTES.host;

    case "ADMIN":
      return AUTH_ROUTES.admin;
  }
}

export function isRoleAllowedPath(role: AuthRole, pathname: string): boolean {
  if (pathname === "/panel" || pathname.startsWith("/panel/")) {
    return role === "ADMIN";
  }

  if (pathname === "/host" || pathname.startsWith("/host/")) {
    return role === "HOST";
  }

  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return role === "VISITOR";
  }

  return true;
}
