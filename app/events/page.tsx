import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { VisitorEventsPage } from "@/components/visitor";

export default async function EventsPage() {
  const session = await auth();

  const activeRole = session?.user?.activeRole;

  if (activeRole === "HOST") {
    redirect("/host");
  }

  if (activeRole === "ADMIN") {
    redirect("/panel");
  }

  const canSave = Boolean(session?.user?.id) && activeRole === "VISITOR";

  return <VisitorEventsPage canSave={canSave} />;
}
