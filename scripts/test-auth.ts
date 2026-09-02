import "dotenv/config";

import { createHash } from "crypto";

import { UserRole } from "../src/generated/prisma/client";

import { prisma } from "../src/server/db/prisma";

import { authenticateWithOtp } from "../src/server/auth/authenticate";

const TEST_PHONE = "09120000001";

const TEST_CODE = "12345";

function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

async function createOtp(phoneNumber: string) {
  await prisma.otpVerification.deleteMany({
    where: {
      phoneNumber,
    },
  });

  await prisma.otpVerification.create({
    data: {
      phoneNumber,
      codeHash: hashOtp(TEST_CODE),

      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

async function main() {
  console.log("\nFUNIMA AUTH TEST\n");

  /*
   * Cleanup old test user.
   */
  await prisma.user.deleteMany({
    where: {
      phoneNumber: TEST_PHONE,
    },
  });

  /*
   * TEST 1
   * Create Visitor.
   */
  await createOtp(TEST_PHONE);

  const visitorResult = await authenticateWithOtp({
    phoneNumber: TEST_PHONE,

    code: TEST_CODE,

    role: UserRole.VISITOR,

    fullName: "Funima Test User",
  });

  assert(visitorResult.success, "Visitor signup failed");

  assert(
    visitorResult.user.activeRole === UserRole.VISITOR,
    "Visitor activeRole incorrect",
  );

  assert(
    visitorResult.user.roles.includes(UserRole.VISITOR),
    "VISITOR role not saved",
  );

  console.log("✓ Visitor signup");

  /*
   * TEST 2
   * Same phone becomes Host.
   */
  await createOtp(TEST_PHONE);

  const hostResult = await authenticateWithOtp({
    phoneNumber: TEST_PHONE,

    code: TEST_CODE,

    role: UserRole.HOST,
  });

  assert(hostResult.success, "Host registration failed");

  assert(
    hostResult.user.activeRole === UserRole.HOST,
    "Host activeRole incorrect",
  );

  assert(
    hostResult.user.roles.includes(UserRole.VISITOR),
    "VISITOR role disappeared",
  );

  assert(hostResult.user.roles.includes(UserRole.HOST), "HOST role not added");

  console.log("✓ Same phone can be Visitor + Host");

  /*
   * TEST 3
   * DB relations exist.
   */
  const dbUser = await prisma.user.findUnique({
    where: {
      phoneNumber: TEST_PHONE,
    },

    include: {
      visitor: true,
      host: true,
    },
  });

  assert(dbUser, "User not found");

  assert(dbUser.visitor, "Visitor row missing");

  assert(dbUser.host, "Host row missing");

  console.log("✓ Visitor and Host profiles created");

  /*
   * TEST 4
   * Admin escalation must fail.
   */
  await createOtp(TEST_PHONE);

  const adminResult = await authenticateWithOtp({
    phoneNumber: TEST_PHONE,

    code: TEST_CODE,

    role: UserRole.ADMIN,
  });

  assert(!adminResult.success, "Non-admin escalated to ADMIN");

  console.log("✓ ADMIN privilege escalation blocked");

  /*
   * TEST 5
   * Give ADMIN explicitly from DB.
   */
  await prisma.user.update({
    where: {
      phoneNumber: TEST_PHONE,
    },

    data: {
      roles: {
        push: UserRole.ADMIN,
      },
    },
  });

  await createOtp(TEST_PHONE);

  const realAdminResult = await authenticateWithOtp({
    phoneNumber: TEST_PHONE,

    code: TEST_CODE,

    role: UserRole.ADMIN,
  });

  assert(realAdminResult.success, "Existing ADMIN could not login");

  assert(
    realAdminResult.user.activeRole === UserRole.ADMIN,
    "ADMIN activeRole incorrect",
  );

  console.log("✓ Existing ADMIN login");

  /*
   * TEST 6
   * Wrong OTP.
   */
  await createOtp(TEST_PHONE);

  const wrongOtp = await authenticateWithOtp({
    phoneNumber: TEST_PHONE,

    code: "99999",

    role: UserRole.VISITOR,
  });

  assert(!wrongOtp.success, "Wrong OTP was accepted");

  console.log("✓ Invalid OTP rejected");

  /*
   * Cleanup.
   */
  await prisma.user.deleteMany({
    where: {
      phoneNumber: TEST_PHONE,
    },
  });

  await prisma.otpVerification.deleteMany({
    where: {
      phoneNumber: TEST_PHONE,
    },
  });

  console.log("\n✓ ALL AUTH TESTS PASSED\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
