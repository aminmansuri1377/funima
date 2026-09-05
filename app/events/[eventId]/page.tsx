import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { VisitorEventPage } from "@/components/visitor";

type Props = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventSinglePage({ params }: Props) {
  const session = await auth();

  const activeRole = session?.user?.activeRole;

  if (activeRole === "HOST") {
    redirect("/host");
  }

  if (activeRole === "ADMIN") {
    redirect("/panel");
  }

  const { eventId } = await params;

  const isVisitor = Boolean(session?.user?.id) && activeRole === "VISITOR";

  return (
    <VisitorEventPage
      eventId={eventId}
      canSave={isVisitor}
      canComment={isVisitor}
    />
  );
}
