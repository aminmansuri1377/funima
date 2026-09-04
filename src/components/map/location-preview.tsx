"use client";

import { MapView } from "./map-view";

type LocationPreviewProps = {
  latitude: number;
  longitude: number;

  className?: string;

  showNavigation?: boolean;
};

export function LocationPreview({
  latitude,
  longitude,
  className = "h-[240px] sm:h-[320px]",
  showNavigation = true,
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
      />
    </div>
  );
}
