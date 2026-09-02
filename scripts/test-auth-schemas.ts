import {
  authRoleSchema,
  fullNameSchema,
  nextAuthCredentialsSchema,
  otpCodeSchema,
  phoneNumberSchema,
} from "../src/lib/auth/schemas";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function main() {
  console.log("\nFUNIMA AUTH SCHEMA TEST\n");

  assert(
    phoneNumberSchema.safeParse("09123456789").success,
    "Valid phone rejected",
  );

  assert(!phoneNumberSchema.safeParse("12").success, "Invalid phone accepted");

  console.log("✓ Phone validation");

  assert(
    fullNameSchema.safeParse("امین منصوری").success,
    "Valid full name rejected",
  );

  assert(!fullNameSchema.safeParse("A").success, "Short full name accepted");

  console.log("✓ Full name validation");

  assert(otpCodeSchema.safeParse("12345").success, "Valid OTP rejected");

  assert(!otpCodeSchema.safeParse("1234").success, "Short OTP accepted");

  assert(!otpCodeSchema.safeParse("12abc").success, "Non-numeric OTP accepted");

  console.log("✓ OTP validation");

  assert(authRoleSchema.safeParse("VISITOR").success, "Visitor role rejected");

  assert(
    !authRoleSchema.safeParse("SUPER_ADMIN").success,
    "Invalid role accepted",
  );

  console.log("✓ Role validation");

  assert(
    nextAuthCredentialsSchema.safeParse({
      phoneNumber: "09123456789",
      code: "12345",
      role: "HOST",
    }).success,
    "Existing user login rejected",
  );

  assert(
    nextAuthCredentialsSchema.safeParse({
      phoneNumber: "09123456789",
      code: "12345",
      role: "VISITOR",
      fullName: "امین منصوری",
    }).success,
    "New user credentials rejected",
  );

  console.log("✓ NextAuth credentials validation");

  console.log("\n✓ ALL AUTH SCHEMA TESTS PASSED\n");
}

main();
