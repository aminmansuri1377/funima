import "dotenv/config";

import { createHash } from "crypto";

import { prisma } from "../src/server/db/prisma";

import { requestOtp, verifyOtp } from "../src/server/auth/otp";

const PHONE = "09120000002";

const CODE = "12345";

function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

async function createTestOtp(options?: {
  expired?: boolean;
  attempts?: number;
}) {
  await prisma.otpVerification.create({
    data: {
      phoneNumber: PHONE,

      codeHash: hashOtp(CODE),

      attempts: options?.attempts ?? 0,

      expiresAt: options?.expired
        ? new Date(Date.now() - 60_000)
        : new Date(Date.now() + 5 * 60 * 1000),
    },
  });
}

async function cleanup() {
  await prisma.otpVerification.deleteMany({
    where: {
      phoneNumber: PHONE,
    },
  });
}

async function main() {
  console.log("\nFUNIMA OTP TEST\n");

  await cleanup();

  /*
   * Valid OTP
   */
  await createTestOtp();

  const valid = await verifyOtp(PHONE, CODE);

  assert(valid.success, "Valid OTP rejected");

  console.log("✓ Valid OTP accepted");

  /*
   * OTP cannot be reused.
   */
  const reused = await verifyOtp(PHONE, CODE);

  assert(!reused.success, "Used OTP accepted twice");

  console.log("✓ OTP reuse blocked");

  /*
   * Expired OTP.
   */
  await cleanup();

  await createTestOtp({
    expired: true,
  });

  const expired = await verifyOtp(PHONE, CODE);

  assert(!expired.success, "Expired OTP accepted");

  console.log("✓ Expired OTP rejected");

  /*
   * Invalid OTP.
   */
  await cleanup();

  await createTestOtp();

  const invalid = await verifyOtp(PHONE, "99999");

  assert(!invalid.success, "Invalid OTP accepted");

  console.log("✓ Invalid OTP rejected");

  /*
   * Maximum attempts.
   */
  await cleanup();

  await createTestOtp({
    attempts: 4,
  });

  const finalAttempt = await verifyOtp(PHONE, "99999");

  assert(
    !finalAttempt.success && finalAttempt.reason === "TOO_MANY_ATTEMPTS",
    "Attempt limit not enforced",
  );

  console.log("✓ OTP attempt limit");

  /*
   * Resend cooldown.
   */
  await cleanup();

  const firstRequest = await requestOtp(PHONE);

  assert(firstRequest.success, "First OTP request failed");

  const immediateRequest = await requestOtp(PHONE);

  assert(
    !immediateRequest.success && immediateRequest.reason === "OTP_COOLDOWN",
    "OTP cooldown not enforced",
  );

  console.log("✓ OTP resend cooldown");

  await cleanup();

  console.log("\n✓ ALL OTP TESTS PASSED\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
