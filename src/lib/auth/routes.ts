import {
  UserRole,
  type UserRole as UserRoleType,
} from "@/generated/prisma/client";

export const AUTH_ROUTES = {
  visitor: "/auth/visitor",
  host: "/auth/host",
  admin: "/panel/login",
} as const;

export const ROLE_HOME: Record<UserRoleType, string> = {
  [UserRole.VISITOR]: "/",
  [UserRole.HOST]: "/host",
  [UserRole.ADMIN]: "/panel",
};

export function getRoleHome(role: UserRoleType): string {
  return ROLE_HOME[role];
}

export function getAuthRoute(role: UserRoleType): string {
  switch (role) {
    case UserRole.VISITOR:
      return AUTH_ROUTES.visitor;

    case UserRole.HOST:
      return AUTH_ROUTES.host;

    case UserRole.ADMIN:
      return AUTH_ROUTES.admin;
  }
}

export function isRoleAllowedPath(
  role: UserRoleType,
  pathname: string,
): boolean {
  if (pathname === "/panel" || pathname.startsWith("/panel/")) {
    return role === UserRole.ADMIN;
  }

  if (pathname === "/host" || pathname.startsWith("/host/")) {
    return role === UserRole.HOST;
  }

  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return role === UserRole.VISITOR;
  }

  return true;
}
