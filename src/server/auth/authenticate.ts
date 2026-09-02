import {
  UserRole,
  type UserRole as UserRoleType,
} from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";
import { normalizePhoneNumber, verifyOtp } from "@/server/auth/otp";

type AuthenticateInput = {
  phoneNumber: string;
  code: string;
  role: UserRoleType;
  fullName?: string;
};

type AuthenticateResult =
  | {
      success: true;
      user: {
        id: string;
        phoneNumber: string;
        fullName: string;
        profileImage: string | null;
        roles: UserRoleType[];
        activeRole: UserRoleType;
      };
    }
  | {
      success: false;
      reason: "INVALID_OTP" | "ADMIN_NOT_ALLOWED" | "FULL_NAME_REQUIRED";
    };

export async function authenticateWithOtp(
  input: AuthenticateInput,
): Promise<AuthenticateResult> {
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);

  const otpResult = await verifyOtp(phoneNumber, input.code);

  if (!otpResult.success) {
    return {
      success: false,
      reason: "INVALID_OTP",
    };
  }

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
   * ADMIN:
   * never created automatically.
   */
  if (input.role === UserRole.ADMIN) {
    if (!user || !user.roles.includes(UserRole.ADMIN)) {
      return {
        success: false,
        reason: "ADMIN_NOT_ALLOWED",
      };
    }
  }

  /*
   * New Visitor / Host.
   */
  if (!user) {
    const fullName = input.fullName?.trim();

    if (!fullName) {
      return {
        success: false,
        reason: "FULL_NAME_REQUIRED",
      };
    }

    user = await prisma.user.create({
      data: {
        phoneNumber,
        fullName,
        roles: [input.role],

        ...(input.role === UserRole.VISITOR
          ? {
              visitor: {
                create: {},
              },
            }
          : {}),

        ...(input.role === UserRole.HOST
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
   * Existing user adds another public role.
   */
  if (input.role !== UserRole.ADMIN && !user.roles.includes(input.role)) {
    user = await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        roles: {
          push: input.role,
        },

        ...(input.role === UserRole.VISITOR && !user.visitor
          ? {
              visitor: {
                create: {},
              },
            }
          : {}),

        ...(input.role === UserRole.HOST && !user.host
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
    success: true,

    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      profileImage: user.profileImage,
      roles: user.roles,
      activeRole: input.role,
    },
  };
}
