"use client";

import { useRouter } from "next/navigation";

import { EventForm } from "./event-form";

import { Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function CreateEventManager() {
  const router = useRouter();

  const create = trpc.panel.events.create.useMutation();

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="heading-xl">
          افزودن رویداد
        </Text>

        <Text tone="secondary" className="mt-1">
          ایجاد رویداد جدید برای یکی از مکان‌ها
        </Text>
      </div>

      <EventForm
        submitLabel="ایجاد رویداد"
        loading={create.isPending}
        onSubmit={async (values) => {
          const result = await create.mutateAsync(values);

          router.push(`/panel/events/${result.eventId}`);
        }}
      />
    </div>
  );
}
