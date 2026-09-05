"use client";

import dynamic from "next/dynamic";

import type { LngLat, MapProviderName } from "@/lib/map/types";

export type FunimaMapViewProps = {
  position?: LngLat | null;

  initialCenter?: LngLat;

  initialZoom?: number;

  interactive?: boolean;

  draggableMarker?: boolean;

  showNavigation?: boolean;

  className?: string;

  provider?: MapProviderName;

  onLocationChange?: (value: LngLat) => void;
};

const DynamicMapCanvas = dynamic(
  () => import("./map-canvas").then((module) => module.MapCanvas),
  {
    ssr: false,

    loading: () => (
      <div
        className="
            flex
            h-full
            w-full
            items-center
            justify-center
            bg-gray-100
            text-sm
            text-(--color-text-secondary)
          "
      >
        در حال بارگذاری نقشه...
      </div>
    ),
  },
);

export function MapView(props: FunimaMapViewProps) {
  return (
    <div
      className="
        relative
        h-full
        w-full
      "
    >
      <DynamicMapCanvas {...props} />
    </div>
  );
}
