"use client";

import { useState } from "react";

import { Text } from "@/components/ui";

import { LocationPicker } from "@/components/map";

import type { LngLat } from "@/lib/map/types";

export default function MapTestPage() {
  const [position, setPosition] = useState<LngLat | null>([51.389, 35.6892]);

  return (
    <main
      className="
        min-h-screen
        bg-[#f7f7f7]
        px-4
        py-6
        sm:px-8
        sm:py-8
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-4xl
          space-y-6
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            تست Location Picker
          </Text>

          <Text tone="secondary" className="mt-1">
            نسخه Leaflet نقشه فانیما
          </Text>
        </div>

        <div
          className="
            rounded-[28px]
            bg-white
            p-4
            shadow-sm
            sm:p-6
          "
        >
          <LocationPicker
            value={position}
            onChange={setPosition}
            provider="openstreetmap"
          />
        </div>

        {position && (
          <div
            className="
              rounded-[20px]
              bg-white
              p-4
            "
          >
            <Text variant="label-md">داده فرم:</Text>

            <pre
              dir="ltr"
              className="
                mt-3
                overflow-x-auto
                rounded-xl
                bg-gray-50
                p-3
                text-left
                text-sm
              "
            >
              {JSON.stringify(
                {
                  longitude: position[0],

                  latitude: position[1],
                },
                null,
                2,
              )}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
