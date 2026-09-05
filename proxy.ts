import { NextResponse } from "next/server";

import { auth } from "@/auth";

import {
  getAuthRoute,
  getRoleHome,
  isRoleAllowedPath,
} from "@/lib/auth/routes";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  if (pathname === "/panel/login") {
    return NextResponse.next();
  }

  const session = req.auth;

  const activeRole = session?.user?.activeRole;

  const isPanelRoute = pathname === "/panel" || pathname.startsWith("/panel/");

  const isHostRoute = pathname === "/host" || pathname.startsWith("/host/");

  const isProtectedRoute = isPanelRoute || isHostRoute;

  /*
   * Visitor browsing routes مثل:
   *
   * /
   * /events
   * /places/[placeId]
   * /events/[eventId]
   * /profile
   *
   * عمومی هستند.
   *
   * خود صفحه /profile تصمیم می‌گیرد
   * Guest باید First Arrive ببیند
   * یا Visitor پروفایل واقعی را.
   */
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!activeRole) {
    if (isPanelRoute) {
      return NextResponse.redirect(new URL(getAuthRoute("ADMIN"), req.url));
    }

    return NextResponse.redirect(new URL(getAuthRoute("HOST"), req.url));
  }

  if (!isRoleAllowedPath(activeRole, pathname)) {
    return NextResponse.redirect(new URL(getRoleHome(activeRole), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/panel/:path*", "/host/:path*"],
};
