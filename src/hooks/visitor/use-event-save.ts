"use client";

import { trpc } from "@/trpc/client";

export function useEventSave() {
  const utils = trpc.useUtils();

  const save = trpc.visitor.events.save.useMutation();

  const unsave = trpc.visitor.events.unsave.useMutation();

  async function syncQueries(eventId?: string) {
    await Promise.all([
      /*
       * صفحه اصلی Eventها
       */
      utils.visitor.events.list.invalidate(),

      /*
       * Saved Events در Profile
       */
      utils.visitor.saved.events.invalidate(),

      /*
       * Count پروفایل
       */
      utils.visitor.profile.me.invalidate(),

      /*
       * Place Single ممکن است Eventهای
       * همان مکان را نمایش دهد.
       */
      utils.visitor.places.getById.invalidate(),

      /*
       * Single Event
       */
      eventId
        ? utils.visitor.events.getById.invalidate({
            eventId,
          })
        : Promise.resolve(),
    ]);
  }

  async function toggle(eventId: string, nextSaved: boolean) {
    if (nextSaved) {
      await save.mutateAsync({
        eventId,
      });
    } else {
      await unsave.mutateAsync({
        eventId,
      });
    }

    await syncQueries(eventId);
  }

  return {
    toggle,

    save,

    unsave,

    isPending: save.isPending || unsave.isPending,
  };
}
