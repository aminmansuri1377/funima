import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { VisitorHomePage } from "@/components/visitor";

export default async function HomePage() {
  const session = await auth();

  const activeRole = session?.user?.activeRole;

  /*
   * ========================================
   * GUEST
   * ========================================
   *
   * کاربری که هنوز وارد نشده،
   * می‌تواند Home بخش Visitor را ببیند.
   *
   * ولی قابلیت Save ندارد.
   */
  if (!session?.user?.id || !activeRole) {
    return <VisitorHomePage canSave={false} />;
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
   *
   * Visitor لاگین‌شده همان Home را
   * می‌بیند، با قابلیت Save / Unsave.
   */

  return <VisitorHomePage canSave={true} />;
}
