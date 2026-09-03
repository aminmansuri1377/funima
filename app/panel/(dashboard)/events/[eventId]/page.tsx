import { EditEventManager } from "@/components/panel/events/edit-event-manager";

type Props = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EditEventPage({ params }: Props) {
  const { eventId } = await params;

  return <EditEventManager eventId={eventId} />;
}
