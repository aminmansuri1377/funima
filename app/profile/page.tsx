import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { VisitorProfilePage } from "@/components/visitor";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.activeRole) {
    redirect("/auth");
  }

  if (session.user.activeRole === "HOST") {
    redirect("/host");
  }

  if (session.user.activeRole === "ADMIN") {
    redirect("/panel");
  }

  return <VisitorProfilePage />;
}
