import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import type { UserRole } from "@/generated/prisma/client";

import { authenticateWithOtp } from "@/server/auth/authenticate";

const credentialsSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  code: z.string().regex(/^\d{5}$/),
  role: z.enum(["VISITOR", "HOST", "ADMIN"]),
  fullName: z.string().optional(),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      name: "Phone OTP",

      credentials: {
        phoneNumber: {
          type: "text",
        },

        code: {
          type: "text",
        },

        role: {
          type: "text",
        },

        fullName: {
          type: "text",
        },
      },

      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const result = await authenticateWithOtp({
          phoneNumber: parsed.data.phoneNumber,

          code: parsed.data.code,

          role: parsed.data.role as UserRole,

          fullName: parsed.data.fullName,
        });

        if (!result.success) {
          return null;
        }

        return {
          id: result.user.id,

          phoneNumber: result.user.phoneNumber,

          name: result.user.fullName,

          image: result.user.profileImage,

          roles: result.user.roles,

          activeRole: result.user.activeRole,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        token.phoneNumber = user.phoneNumber;

        token.roles = user.roles;

        token.activeRole = user.activeRole;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        session.user.phoneNumber = token.phoneNumber as string;

        session.user.roles = token.roles as UserRole[];

        session.user.activeRole = token.activeRole as UserRole;
      }

      return session;
    },
  },

  pages: {
    signIn: "/auth",
  },
});
