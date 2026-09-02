import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const session = req.auth;

  const activeRole = session?.user?.activeRole;

  const isPanelRoute = pathname === "/panel" || pathname.startsWith("/panel/");

  const isHostRoute = pathname === "/host" || pathname.startsWith("/host/");

  const isVisitorRoute =
    pathname === "/profile" || pathname.startsWith("/profile/");

  if (isPanelRoute) {
    if (activeRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (isHostRoute) {
    if (activeRole !== "HOST") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (isVisitorRoute) {
    if (activeRole !== "VISITOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/panel/:path*", "/host/:path*", "/profile/:path*"],
};
