import { HostEventManager } from "@/components/host/events/host-event-manager";

type Props = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function HostEventPage({ params }: Props) {
  const { eventId } = await params;

  return <HostEventManager eventId={eventId} />;
}
