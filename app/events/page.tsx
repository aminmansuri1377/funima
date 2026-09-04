import { auth } from "@/auth";

import { redirect } from "next/navigation";

import { VisitorEventsPage } from "@/components/visitor";

export default async function EventsPage() {
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

  return <VisitorEventsPage />;
}
