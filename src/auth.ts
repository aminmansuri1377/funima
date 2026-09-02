import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Phone OTP",

      credentials: {
        phoneNumber: {
          label: "Phone Number",
          type: "text",
        },
        userId: {
          label: "User ID",
          type: "text",
        },
      },

      async authorize(credentials) {
        if (!credentials?.userId || !credentials.phoneNumber) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            id: String(credentials.userId),
          },
        });

        if (!user) {
          return null;
        }

        if (
          user.phoneNumber !==
          String(credentials.phoneNumber).trim()
        ) {
          return null;
        }

        return {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.fullName || null,
          image: user.profileImage,
          roles: user.roles,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phoneNumber = user.phoneNumber;
        token.roles = user.roles;
      }

      return token;
    },

 async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id as string;
    session.user.phoneNumber = token.phoneNumber as string;
    session.user.roles = token.roles as UserRole[];
  }

  return session;
},
  },

  pages: {
    signIn: "/auth",
  },
});