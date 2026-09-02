import "server-only";

import { createHash, randomInt } from "crypto";

import { prisma } from "@/server/db/prisma";

const OTP_LENGTH = 5;
const OTP_EXPIRES_IN_MINUTES = 5;
const MAX_ATTEMPTS = 5;

export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\s+/g, "").trim();
}

function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function requestOtp(phoneNumber: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  const code = randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH).toString();

  const codeHash = hashOtp(code);

  const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

  await prisma.otpVerification.deleteMany({
    where: {
      phoneNumber: normalizedPhone,
      verifiedAt: null,
    },
  });

  await prisma.otpVerification.create({
    data: {
      phoneNumber: normalizedPhone,
      codeHash,
      expiresAt,
    },
  });

  // Temporary fake SMS
  console.log(`[FUNIMA DEV OTP] ${normalizedPhone} => ${code}`);

  return {
    success: true,
    expiresAt,
  };
}

export async function verifyOtp(phoneNumber: string, code: string) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  const otp = await prisma.otpVerification.findFirst({
    where: {
      phoneNumber: normalizedPhone,
      verifiedAt: null,
      expiresAt: {
        gt: new Date(),
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

  if (otp.attempts >= MAX_ATTEMPTS) {
    return {
      success: false,
      reason: "TOO_MANY_ATTEMPTS" as const,
    };
  }

  const isValid = hashOtp(code) === otp.codeHash;

  if (!isValid) {
    await prisma.otpVerification.update({
      where: {
        id: otp.id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    return {
      success: false,
      reason: "INVALID_OTP" as const,
    };
  }

  await prisma.otpVerification.update({
    where: {
      id: otp.id,
    },
    data: {
      verifiedAt: new Date(),
    },
  });

  return {
    success: true,
  };
}
