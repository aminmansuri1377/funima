import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error: "Not found",
      },
      {
        status: 404,
      },
    );
  }

  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      },
    );
  }

  return NextResponse.json({
    authenticated: true,

    user: {
      id: session.user.id,
      phoneNumber: session.user.phoneNumber,
      roles: session.user.roles,
      activeRole: session.user.activeRole,
    },
  });
}
