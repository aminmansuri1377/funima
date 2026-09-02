import { UserRole } from "../src/generated/prisma/client";

import {
  getAuthRoute,
  getRoleHome,
  isRoleAllowedPath,
} from "../src/server/auth/routes";

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

  assert(getRoleHome(UserRole.VISITOR) === "/", "Visitor home incorrect");

  assert(getRoleHome(UserRole.HOST) === "/host", "Host home incorrect");

  assert(getRoleHome(UserRole.ADMIN) === "/panel", "Admin home incorrect");

  console.log("✓ Role home routes");

  /*
   * Auth routes
   */

  assert(
    getAuthRoute(UserRole.VISITOR) === "/auth/visitor",
    "Visitor auth route incorrect",
  );

  assert(
    getAuthRoute(UserRole.HOST) === "/auth/host",
    "Host auth route incorrect",
  );

  assert(
    getAuthRoute(UserRole.ADMIN) === "/panel/login",
    "Admin auth route incorrect",
  );

  console.log("✓ Role auth routes");

  /*
   * Visitor
   */

  assert(
    isRoleAllowedPath(UserRole.VISITOR, "/profile"),
    "Visitor cannot access profile",
  );

  assert(
    !isRoleAllowedPath(UserRole.VISITOR, "/host"),
    "Visitor accessed Host area",
  );

  assert(
    !isRoleAllowedPath(UserRole.VISITOR, "/panel"),
    "Visitor accessed Admin area",
  );

  console.log("✓ Visitor route isolation");

  /*
   * Host
   */

  assert(
    isRoleAllowedPath(UserRole.HOST, "/host"),
    "Host cannot access host area",
  );

  assert(
    isRoleAllowedPath(UserRole.HOST, "/host/events"),
    "Host cannot access nested host route",
  );

  assert(
    !isRoleAllowedPath(UserRole.HOST, "/profile"),
    "Host accessed Visitor profile",
  );

  assert(
    !isRoleAllowedPath(UserRole.HOST, "/panel"),
    "Host accessed Admin panel",
  );

  console.log("✓ Host route isolation");

  /*
   * Admin
   */

  assert(
    isRoleAllowedPath(UserRole.ADMIN, "/panel"),
    "Admin cannot access panel",
  );

  assert(
    isRoleAllowedPath(UserRole.ADMIN, "/panel/users"),
    "Admin cannot access nested panel route",
  );

  assert(
    !isRoleAllowedPath(UserRole.ADMIN, "/host"),
    "Admin accessed Host dashboard",
  );

  assert(
    !isRoleAllowedPath(UserRole.ADMIN, "/profile"),
    "Admin accessed Visitor profile",
  );

  console.log("✓ Admin route isolation");

  /*
   * Public routes.
   */

  assert(
    isRoleAllowedPath(UserRole.VISITOR, "/"),
    "Visitor blocked from public home",
  );

  assert(
    isRoleAllowedPath(UserRole.HOST, "/events"),
    "Host blocked from public events",
  );

  assert(
    isRoleAllowedPath(UserRole.ADMIN, "/places/123"),
    "Admin blocked from public place",
  );

  console.log("✓ Public routes remain public");

  console.log("\n✓ ALL AUTH ROUTE TESTS PASSED\n");
}

main();
