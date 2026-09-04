"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { InlineMessage, Text, uploadEventImages } from "@/components/ui";

import { trpc } from "@/trpc/client";

import { EventForm } from "./event-form";

export function CreateEventManager() {
  const router = useRouter();

  const create = trpc.panel.events.create.useMutation();

  const rollback = trpc.panel.events.delete.useMutation();

  const [error, setError] = useState<string | null>(null);

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

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      <EventForm
        submitLabel="ایجاد رویداد"
        loading={create.isPending || rollback.isPending}
        enableImagePicker
        onSubmit={async (values) => {
          setError(null);

          const { imageFiles, ...eventValues } = values;

          let createdEventId: string | null = null;

          try {
            const result = await create.mutateAsync(eventValues);

            createdEventId = result.eventId;

            if (imageFiles.length > 0) {
              await uploadEventImages(result.eventId, imageFiles);
            }

            router.push(`/panel/events/${result.eventId}`);
          } catch (error) {
            if (createdEventId) {
              try {
                await rollback.mutateAsync({
                  eventId: createdEventId,
                });
              } catch (rollbackError) {
                console.error("[Create Event Rollback]", rollbackError);
              }
            }

            setError(
              error instanceof Error ? error.message : "ساخت رویداد انجام نشد.",
            );
          }
        }}
      />
    </div>
  );
}
