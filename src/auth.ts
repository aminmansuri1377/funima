import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import {
  UserRole,
  type UserRole as UserRoleType,
} from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";
import { normalizePhoneNumber, verifyOtp } from "@/server/auth/otp";

const credentialsSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  code: z.string().regex(/^\d{5}$/),
  role: z.enum(["VISITOR", "HOST", "ADMIN"]),
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
          label: "Phone Number",
          type: "text",
        },

        code: {
          label: "OTP",
          type: "text",
        },

        role: {
          label: "Role",
          type: "text",
        },
      },

      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { phoneNumber: rawPhoneNumber, code, role } = parsed.data;

        const phoneNumber = normalizePhoneNumber(rawPhoneNumber);

        // OTP must be verified before a session can exist.
        const otpResult = await verifyOtp(phoneNumber, code);

        if (!otpResult.success) {
          return null;
        }

        const requestedRole = role as UserRoleType;

        let user = await prisma.user.findUnique({
          where: {
            phoneNumber,
          },

          include: {
            visitor: true,
            host: true,
          },
        });

        /*
         * ADMIN is NEVER automatically created.
         *
         * An admin must already exist in the DB
         * and must already own ADMIN role.
         */
        if (requestedRole === UserRole.ADMIN) {
          if (!user || !user.roles.includes(UserRole.ADMIN)) {
            return null;
          }
        }

        /*
         * First Visitor / Host registration
         */
        if (!user) {
          if (requestedRole === UserRole.ADMIN) {
            return null;
          }

          user = await prisma.user.create({
            data: {
              phoneNumber,
              fullName: "",

              roles: [requestedRole],

              ...(requestedRole === UserRole.VISITOR
                ? {
                    visitor: {
                      create: {},
                    },
                  }
                : {}),

              ...(requestedRole === UserRole.HOST
                ? {
                    host: {
                      create: {},
                    },
                  }
                : {}),
            },

            include: {
              visitor: true,
              host: true,
            },
          });
        }

        /*
         * Existing user wants to also register
         * as Visitor or Host.
         */
        if (
          requestedRole !== UserRole.ADMIN &&
          !user.roles.includes(requestedRole)
        ) {
          user = await prisma.user.update({
            where: {
              id: user.id,
            },

            data: {
              roles: {
                push: requestedRole,
              },

              ...(requestedRole === UserRole.VISITOR && !user.visitor
                ? {
                    visitor: {
                      create: {},
                    },
                  }
                : {}),

              ...(requestedRole === UserRole.HOST && !user.host
                ? {
                    host: {
                      create: {},
                    },
                  }
                : {}),
            },

            include: {
              visitor: true,
              host: true,
            },
          });
        }

        return {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.fullName || null,
          image: user.profileImage,
          roles: user.roles,
          activeRole: requestedRole,
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
      if (!session.user) {
        return session;
      }

      session.user.id = token.id as string;

      session.user.phoneNumber = token.phoneNumber as string;

      session.user.roles = token.roles as UserRoleType[];

      session.user.activeRole = token.activeRole as UserRoleType;

      return session;
    },
  },

  pages: {
    signIn: "/auth",
  },
});
