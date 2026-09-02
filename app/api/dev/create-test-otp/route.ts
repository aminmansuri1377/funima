import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { normalizePhoneNumber } from "@/server/auth/otp";

const TEST_CODE = "12345";

function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
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

  const body = await request.json();

  const phoneNumber = normalizePhoneNumber(body.phoneNumber);

  await prisma.otpVerification.updateMany({
    where: {
      phoneNumber,
      verifiedAt: null,
    },

    data: {
      expiresAt: new Date(),
    },
  });

  await prisma.otpVerification.create({
    data: {
      phoneNumber,

      codeHash: hashOtp(TEST_CODE),

      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return NextResponse.json({
    success: true,

    phoneNumber,

    code: TEST_CODE,
  });
}
