import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { VisitorProfilePage } from "@/components/visitor";

export default async function ProfilePage() {
  const session = await auth();

  const activeRole = session?.user?.activeRole;

  /*
   * ========================================
   * GUEST
   * ========================================
   *
   * اگر کاربر وارد نشده،
   * دقیقاً صفحه اصلی Auth را می‌بیند.
   */
  if (!session?.user?.id || !activeRole) {
    redirect("/auth");
  }

  /*
   * ========================================
   * HOST
   * ========================================
   */

  if (activeRole === "HOST") {
    redirect("/host");
  }

  /*
   * ========================================
   * ADMIN
   * ========================================
   */

  if (activeRole === "ADMIN") {
    redirect("/panel");
  }

  /*
   * ========================================
   * VISITOR
   * ========================================
   */

  return <VisitorProfilePage />;
}
