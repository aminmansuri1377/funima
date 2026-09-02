import { createHash, randomInt } from "crypto";

import { prisma } from "@/server/db/prisma";

const OTP_LENGTH = 5;

const OTP_EXPIRES_IN_MINUTES = 5;

const MAX_VERIFY_ATTEMPTS = 5;

const RESEND_COOLDOWN_SECONDS = 60;

const REQUEST_WINDOW_MINUTES = 15;

const MAX_REQUESTS_PER_WINDOW = 5;

export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\s+/g, "").trim();
}

function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function requestOtp(phoneNumber: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  const now = new Date();

  /*
   * 1) Resend cooldown
   */
  const latestOtp = await prisma.otpVerification.findFirst({
    where: {
      phoneNumber: normalizedPhone,
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      createdAt: true,
    },
  });

  if (latestOtp) {
    const elapsedMs = now.getTime() - latestOtp.createdAt.getTime();

    const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;

    if (elapsedMs < cooldownMs) {
      const retryAfterSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);

      return {
        success: false,
        reason: "OTP_COOLDOWN" as const,
        retryAfterSeconds,
      };
    }
  }

  /*
   * 2) Request rate limit
   *
   * Max 5 OTP requests per
   * phone number every 15 minutes.
   */
  const requestWindowStart = new Date(
    now.getTime() - REQUEST_WINDOW_MINUTES * 60 * 1000,
  );

  const recentRequestCount = await prisma.otpVerification.count({
    where: {
      phoneNumber: normalizedPhone,

      createdAt: {
        gte: requestWindowStart,
      },
    },
  });

  if (recentRequestCount >= MAX_REQUESTS_PER_WINDOW) {
    return {
      success: false,
      reason: "TOO_MANY_OTP_REQUESTS" as const,
    };
  }

  /*
   * 3) Generate OTP
   */
  const code = randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH).toString();

  const codeHash = hashOtp(code);

  const expiresAt = new Date(
    now.getTime() + OTP_EXPIRES_IN_MINUTES * 60 * 1000,
  );

  /*
   * 4) Invalidate previous
   * unverified OTPs.
   *
   * We do NOT delete them because
   * request history is needed for
   * rate limiting.
   */
  await prisma.otpVerification.updateMany({
    where: {
      phoneNumber: normalizedPhone,

      verifiedAt: null,

      expiresAt: {
        gt: now,
      },
    },

    data: {
      expiresAt: now,
    },
  });

  /*
   * 5) Store new OTP.
   */
  await prisma.otpVerification.create({
    data: {
      phoneNumber: normalizedPhone,

      codeHash,

      expiresAt,
    },
  });

  /*
   * Development only.
   *
   * Later this section will be
   * replaced with Kavenegar.
   */
  if (process.env.NODE_ENV !== "production") {
    console.log(`[FUNIMA DEV OTP] ${normalizedPhone} => ${code}`);
  }

  return {
    success: true,
    expiresAt,
  };
}

export async function verifyOtp(phoneNumber: string, code: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  /*
   * OTP format validation.
   */
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) {
    return {
      success: false,
      reason: "INVALID_OTP" as const,
    };
  }

  const now = new Date();

  const otp = await prisma.otpVerification.findFirst({
    where: {
      phoneNumber: normalizedPhone,

      verifiedAt: null,

      expiresAt: {
        gt: now,
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otp) {
    return {
      success: false,
      reason: "OTP_EXPIRED_OR_NOT_FOUND" as const,
    };
  }

  /*
   * Too many incorrect attempts.
   */
  if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      success: false,
      reason: "TOO_MANY_ATTEMPTS" as const,
    };
  }

  const isValid = hashOtp(code) === otp.codeHash;

  if (!isValid) {
    const updated = await prisma.otpVerification.update({
      where: {
        id: otp.id,
      },

      data: {
        attempts: {
          increment: 1,
        },
      },

      select: {
        attempts: true,
      },
    });

    if (updated.attempts >= MAX_VERIFY_ATTEMPTS) {
      return {
        success: false,
        reason: "TOO_MANY_ATTEMPTS" as const,
      };
    }

    return {
      success: false,
      reason: "INVALID_OTP" as const,
    };
  }

  /*
   * OTP becomes one-time-use.
   */
  await prisma.otpVerification.update({
    where: {
      id: otp.id,
    },

    data: {
      verifiedAt: now,
    },
  });

  return {
    success: true,
  };
}
