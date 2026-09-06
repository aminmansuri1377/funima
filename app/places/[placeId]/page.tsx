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

  const activeRole = session?.user?.activeRole;

  /*
   * Host و Admin وارد
   * Visitor Single Place نمی‌شوند.
   */

  if (activeRole === "HOST") {
    redirect("/host");
  }

  if (activeRole === "ADMIN") {
    redirect("/panel");
  }

  const { placeId } = await params;

  const isVisitor = Boolean(session?.user?.id) && activeRole === "VISITOR";

  /*
   * Guest:
   * canSave = false
   *
   * بنابراین:
   * - Favorite مخفی است
   * - Comment مخفی است
   *
   * Visitor:
   * هر دو قابلیت فعال هستند.
   */

  return <VisitorPlacePage placeId={placeId} canSave={isVisitor} />;
}
