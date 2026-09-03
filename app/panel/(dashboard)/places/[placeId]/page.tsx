import { EditPlaceManager } from "@/components/panel/places/edit-place-manager";

type Props = {
  params: Promise<{
    placeId: string;
  }>;
};

export default async function EditPlacePage({ params }: Props) {
  const { placeId } = await params;

  return <EditPlaceManager placeId={placeId} />;
}
