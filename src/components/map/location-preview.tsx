"use client";

import type { MapProviderName } from "@/lib/map/types";

import { MapView } from "./map-view";
import { OpenMapButton } from "./open-map-button";

type LocationPreviewProps = {
  latitude: number;
  longitude: number;

  className?: string;

  showNavigation?: boolean;

  provider?: MapProviderName;

  showOpenInMaps?: boolean;
};

export function LocationPreview({
  latitude,
  longitude,

  className = "h-[240px] sm:h-[320px]",

  showNavigation = true,

  provider = "openstreetmap",

  showOpenInMaps = true,
}: LocationPreviewProps) {
  return (
    <div className="space-y-3">
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

      {showOpenInMaps && (
        <OpenMapButton latitude={latitude} longitude={longitude} />
      )}
    </div>
  );
}
