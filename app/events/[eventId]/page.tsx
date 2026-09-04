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

  if (!session?.user?.id || !session.user.activeRole) {
    redirect("/auth");
  }

  if (session.user.activeRole === "HOST") {
    redirect("/host");
  }

  if (session.user.activeRole === "ADMIN") {
    redirect("/panel");
  }

  const { eventId } = await params;

  return <VisitorEventPage eventId={eventId} />;
}
