"use client";

import { trpc } from "@/trpc/client";

export function usePlaceSave() {
  const utils = trpc.useUtils();

  const save = trpc.visitor.places.save.useMutation();

  const unsave = trpc.visitor.places.unsave.useMutation();

  async function syncQueries(placeId?: string) {
    await Promise.all([
      /*
       * Home sections ممکن است isSaved مکان
       * را نمایش دهند.
       */
      utils.visitor.home.getSections.invalidate(),

      /*
       * Search / Place list
       */
      utils.visitor.places.list.invalidate(),

      /*
       * Saved Places داخل Profile
       */
      utils.visitor.saved.places.invalidate(),

      /*
       * Count بالای Profile
       */
      utils.visitor.profile.me.invalidate(),

      /*
       * Single Place
       */
      placeId
        ? utils.visitor.places.getById.invalidate({
            placeId,
          })
        : Promise.resolve(),
    ]);
  }

  async function toggle(placeId: string, nextSaved: boolean) {
    if (nextSaved) {
      await save.mutateAsync({
        placeId,
      });
    } else {
      await unsave.mutateAsync({
        placeId,
      });
    }

    await syncQueries(placeId);
  }

  return {
    toggle,

    save,

    unsave,

    isPending: save.isPending || unsave.isPending,
  };
}
