import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { VisitorPlacePage } from "@/components/visitor";

type Props = {
  params: Promise<{
    placeId: string;
  }>;
};

export default async function PlaceSinglePage({ params }: Props) {
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

  const { placeId } = await params;

  return <VisitorPlacePage placeId={placeId} />;
}
