import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phoneNumber: string;
      roles: UserRole[];
      activeRole: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    phoneNumber: string;
    roles: UserRole[];
    activeRole: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phoneNumber: string;
    roles: UserRole[];
    activeRole: UserRole;
  }
}
