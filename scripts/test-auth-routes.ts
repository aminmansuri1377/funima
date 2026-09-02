// import { UserRole } from "../src/generated/prisma/client";

import {
  getAuthRoute,
  getRoleHome,
  isRoleAllowedPath,
} from "../src/lib/auth/routes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function main() {
  console.log("\nFUNIMA AUTH ROUTE TEST\n");

  /*
   * Home redirects
   */

  assert(getRoleHome("VISITOR") === "/", "Visitor home incorrect");

  assert(getRoleHome("HOST") === "/host", "Host home incorrect");

  assert(getRoleHome("ADMIN") === "/panel", "Admin home incorrect");

  console.log("✓ Role home routes");

  /*
   * Auth routes
   */

  assert(
    getAuthRoute("VISITOR") === "/auth/visitor",
    "Visitor auth route incorrect",
  );

  assert(getAuthRoute("HOST") === "/auth/host", "Host auth route incorrect");

  assert(
    getAuthRoute("ADMIN") === "/panel/login",
    "Admin auth route incorrect",
  );

  console.log("✓ Role auth routes");

  /*
   * Visitor
   */

  assert(
    isRoleAllowedPath("VISITOR", "/profile"),
    "Visitor cannot access profile",
  );

  assert(!isRoleAllowedPath("VISITOR", "/host"), "Visitor accessed Host area");

  assert(
    !isRoleAllowedPath("VISITOR", "/panel"),
    "Visitor accessed Admin area",
  );

  console.log("✓ Visitor route isolation");

  /*
   * Host
   */

  assert(isRoleAllowedPath("HOST", "/host"), "Host cannot access host area");

  assert(
    isRoleAllowedPath("HOST", "/host/events"),
    "Host cannot access nested host route",
  );

  assert(
    !isRoleAllowedPath("HOST", "/profile"),
    "Host accessed Visitor profile",
  );

  assert(!isRoleAllowedPath("HOST", "/panel"), "Host accessed Admin panel");

  console.log("✓ Host route isolation");

  /*
   * Admin
   */

  assert(isRoleAllowedPath("ADMIN", "/panel"), "Admin cannot access panel");

  assert(
    isRoleAllowedPath("ADMIN", "/panel/users"),
    "Admin cannot access nested panel route",
  );

  assert(!isRoleAllowedPath("ADMIN", "/host"), "Admin accessed Host dashboard");

  assert(
    !isRoleAllowedPath("ADMIN", "/profile"),
    "Admin accessed Visitor profile",
  );

  console.log("✓ Admin route isolation");

  /*
   * Public routes.
   */

  assert(isRoleAllowedPath("VISITOR", "/"), "Visitor blocked from public home");

  assert(
    isRoleAllowedPath("HOST", "/events"),
    "Host blocked from public events",
  );

  assert(
    isRoleAllowedPath("ADMIN", "/places/123"),
    "Admin blocked from public place",
  );

  console.log("✓ Public routes remain public");

  console.log("\n✓ ALL AUTH ROUTE TESTS PASSED\n");
}

main();
