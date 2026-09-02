import "dotenv/config";

import { UserRole } from "../src/generated/prisma/client";
import { prisma } from "../src/server/db/prisma";
import { appRouter } from "../src/server/trpc/root";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function createSession(activeRole: UserRole) {
  return {
    user: {
      id: "test-user-id",
      phoneNumber: "09120000000",
      roles: [UserRole.VISITOR, UserRole.HOST, UserRole.ADMIN],
      activeRole,
      name: "Test User",
      email: null,
      image: null,
    },
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

async function expectAllowed(
  activeRole: UserRole,
  procedure: "visitorOnly" | "hostOnly" | "adminOnly",
) {
  const caller = appRouter.createCaller({
    prisma,
    session: createSession(activeRole),
  });

  const result = await caller.authzTest[procedure]();

  assert(
    result.ok === true,
    `${activeRole} should be allowed to call ${procedure}`,
  );
}

async function expectForbidden(
  activeRole: UserRole,
  procedure: "visitorOnly" | "hostOnly" | "adminOnly",
) {
  const caller = appRouter.createCaller({
    prisma,
    session: createSession(activeRole),
  });

  let forbidden = false;

  try {
    await caller.authzTest[procedure]();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "FORBIDDEN"
    ) {
      forbidden = true;
    }
  }

  assert(forbidden, `${activeRole} should NOT be allowed to call ${procedure}`);
}

async function main() {
  console.log("\nFUNIMA tRPC AUTHORIZATION TEST\n");

  await expectAllowed(UserRole.VISITOR, "visitorOnly");

  await expectForbidden(UserRole.VISITOR, "hostOnly");

  await expectForbidden(UserRole.VISITOR, "adminOnly");

  console.log("✓ Visitor isolation");

  await expectForbidden(UserRole.HOST, "visitorOnly");

  await expectAllowed(UserRole.HOST, "hostOnly");

  await expectForbidden(UserRole.HOST, "adminOnly");

  console.log("✓ Host isolation");

  await expectForbidden(UserRole.ADMIN, "visitorOnly");

  await expectForbidden(UserRole.ADMIN, "hostOnly");

  await expectAllowed(UserRole.ADMIN, "adminOnly");

  console.log("✓ Admin isolation");

  console.log("\n✓ ALL tRPC AUTHORIZATION TESTS PASSED\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
