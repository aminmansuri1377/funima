import { NextResponse } from "next/server";

import { auth } from "@/auth";

import {
  getAuthRoute,
  getRoleHome,
  isRoleAllowedPath,
} from "@/server/auth/routes";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  if (pathname === "/panel/login") {
    return NextResponse.next();
  }
  const session = req.auth;

  const activeRole = session?.user?.activeRole;

  const isPanelRoute = pathname === "/panel" || pathname.startsWith("/panel/");

  const isHostRoute = pathname === "/host" || pathname.startsWith("/host/");

  const isVisitorRoute =
    pathname === "/profile" || pathname.startsWith("/profile/");

  const isProtectedRoute = isPanelRoute || isHostRoute || isVisitorRoute;

  /*
   * Public route.
   */
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  /*
   * Protected route but user
   * has no valid session.
   */
  if (!activeRole) {
    if (isPanelRoute) {
      return NextResponse.redirect(new URL(getAuthRoute("ADMIN"), req.url));
    }

    if (isHostRoute) {
      return NextResponse.redirect(new URL(getAuthRoute("HOST"), req.url));
    }

    return NextResponse.redirect(new URL(getAuthRoute("VISITOR"), req.url));
  }

  /*
   * Logged-in user trying to access
   * another role's protected area.
   */
  if (!isRoleAllowedPath(activeRole, pathname)) {
    return NextResponse.redirect(new URL(getRoleHome(activeRole), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/panel/:path*", "/host/:path*", "/profile/:path*"],
};
