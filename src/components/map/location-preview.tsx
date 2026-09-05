"use client";

import type { MapProviderName } from "@/lib/map/types";

import { MapView } from "./map-view";

type LocationPreviewProps = {
  latitude: number;

  longitude: number;

  className?: string;

  showNavigation?: boolean;

  provider?: MapProviderName;
};

export function LocationPreview({
  latitude,

  longitude,

  className = "h-[240px] sm:h-[320px]",

  showNavigation = true,

  provider = "openstreetmap",
}: LocationPreviewProps) {
  return (
    <div
      className={`
        overflow-hidden
        rounded-[22px]
        border
        border-(--color-border)
        bg-gray-100
        ${className}
      `}
    >
      <MapView
        position={[longitude, latitude]}
        interactive
        draggableMarker={false}
        showNavigation={showNavigation}
        provider={provider}
      />
    </div>
  );
}
