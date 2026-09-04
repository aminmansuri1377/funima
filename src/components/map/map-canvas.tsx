"use client";

import { useEffect, useRef } from "react";

import {
  AttributionControl,
  Map,
  Marker,
  NavigationControl,
  type MapRef,
} from "@vis.gl/react-maplibre";

import { FiMapPin } from "react-icons/fi";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  OPEN_FREE_MAP_STYLE,
  SELECTED_LOCATION_ZOOM,
} from "@/lib/map/constants";

import type { LngLat } from "@/lib/map/types";

export type FunimaMapCanvasProps = {
  position?: LngLat | null;

  initialCenter?: LngLat;

  initialZoom?: number;

  interactive?: boolean;

  draggableMarker?: boolean;

  showNavigation?: boolean;

  className?: string;

  onLocationChange?: (value: LngLat) => void;
};

export function MapCanvas({
  position = null,

  initialCenter,

  initialZoom,

  interactive = true,

  draggableMarker = false,

  showNavigation = true,

  className = "",

  onLocationChange,
}: FunimaMapCanvasProps) {
  const mapRef = useRef<MapRef | null>(null);

  const center = position ?? initialCenter ?? DEFAULT_MAP_CENTER;

  const zoom =
    initialZoom ?? (position ? SELECTED_LOCATION_ZOOM : DEFAULT_MAP_ZOOM);

  /*
   * مهم:
   *
   * هر وقت position از بیرون تغییر کرد
   * مثلاً از Search یا GPS،
   * camera نقشه هم به آن نقطه حرکت می‌کند.
   */
  useEffect(() => {
    if (!position || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [position[0], position[1]],

      zoom: SELECTED_LOCATION_ZOOM,

      duration: 900,

      essential: true,
    });
  }, [position]);

  return (
    <div
      className={`
        relative
        h-full
        w-full
        overflow-hidden
        rounded-3xl
        bg-gray-100
        ${className}
      `}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: center[0],

          latitude: center[1],

          zoom,
        }}
        mapStyle={OPEN_FREE_MAP_STYLE}
        minZoom={3}
        maxZoom={19}
        attributionControl={false}
        dragPan={interactive}
        scrollZoom={interactive}
        doubleClickZoom={interactive}
        touchZoomRotate={interactive}
        keyboard={interactive}
        onClick={(event) => {
          if (!interactive || !onLocationChange) {
            return;
          }

          onLocationChange([event.lngLat.lng, event.lngLat.lat]);
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <AttributionControl
          compact
          position="bottom-left"
          customAttribution={["OpenFreeMap", "© OpenStreetMap"]}
        />

        {showNavigation && interactive && (
          <NavigationControl position="bottom-right" showCompass showZoom />
        )}

        {position && (
          <Marker
            longitude={position[0]}
            latitude={position[1]}
            anchor="bottom"
            draggable={draggableMarker && interactive}
            onDragEnd={(event) => {
              if (!onLocationChange) {
                return;
              }

              onLocationChange([event.lngLat.lng, event.lngLat.lat]);
            }}
          >
            <LocationMarker draggable={draggableMarker && interactive} />
          </Marker>
        )}
      </Map>
    </div>
  );
}

function LocationMarker({ draggable }: { draggable: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`
        relative
        flex
        h-11
        w-11
        items-center
        justify-center

        ${draggable ? "cursor-grab active:cursor-grabbing" : ""}
      `}
    >
      <span
        className="
          absolute
          bottom-0
          left-1/2
          h-2
          w-6
          -translate-x-1/2
          rounded-full
          bg-black/20
          blur-[2px]
        "
      />

      <span
        className="
          relative
          flex
          h-10
          w-10
          -translate-y-1
          items-center
          justify-center
          rounded-full
          border-[3px]
          border-white
          bg-(--color-brand-500)
          text-white
          shadow-lg
        "
      >
        <FiMapPin size={20} />
      </span>
    </div>
  );
}
