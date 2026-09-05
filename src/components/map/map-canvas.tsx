"use client";

import { useEffect, useRef } from "react";

import L from "leaflet";

import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_PROVIDER,
  DEFAULT_MAP_ZOOM,
  SELECTED_LOCATION_ZOOM,
} from "@/lib/map/constants";

import { getMapProvider } from "@/lib/map/provider";

import type { LngLat, MapProviderName } from "@/lib/map/types";

export type FunimaMapCanvasProps = {
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

export function MapCanvas({
  position = null,

  initialCenter,

  initialZoom,

  interactive = true,

  draggableMarker = false,

  showNavigation = true,

  className = "",

  provider = DEFAULT_MAP_PROVIDER,

  onLocationChange,
}: FunimaMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<LeafletMap | null>(null);

  const markerRef = useRef<LeafletMarker | null>(null);

  const onLocationChangeRef = useRef(onLocationChange);

  /*
   * آخرین callback را بدون ساخت
   * مجدد Map نگه می‌داریم.
   */
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  /*
   * ========================================
   * CREATE MAP
   * ========================================
   */

  useEffect(() => {
    const container = containerRef.current;

    if (!container || mapRef.current) {
      return;
    }

    const center = position ?? initialCenter ?? DEFAULT_MAP_CENTER;

    const zoom =
      initialZoom ?? (position ? SELECTED_LOCATION_ZOOM : DEFAULT_MAP_ZOOM);

    const tileProvider = getMapProvider(provider);

    const map = L.map(container, {
      center: [center[1], center[0]],

      zoom,

      zoomControl: showNavigation,

      attributionControl: true,

      dragging: interactive,

      scrollWheelZoom: interactive,

      doubleClickZoom: interactive,

      touchZoom: interactive,

      keyboard: interactive,

      boxZoom: interactive,
    });

    mapRef.current = map;

    /*
     * مهم:
     *
     * undefined را مستقیم به
     * subdomains نمی‌دهیم.
     */
    const tileOptions: L.TileLayerOptions = {
      attribution: tileProvider.attribution,

      maxZoom: tileProvider.maxZoom,
    };

    if (tileProvider.subdomains) {
      tileOptions.subdomains = tileProvider.subdomains;
    }

    L.tileLayer(tileProvider.url, tileOptions).addTo(map);

    /*
     * انتخاب نقطه با کلیک
     */
    if (interactive) {
      map.on("click", (event) => {
        onLocationChangeRef.current?.([event.latlng.lng, event.latlng.lat]);
      });
    }

    /*
     * Leaflet داخل layoutهای responsive
     * بعد از mount باید اندازه را دوباره
     * محاسبه کند.
     */
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    return () => {
      window.clearTimeout(resizeTimer);

      resizeObserver.disconnect();

      markerRef.current?.remove();

      markerRef.current = null;

      map.remove();

      mapRef.current = null;
    };

    /*
     * Map فقط یک بار ساخته می‌شود.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * ========================================
   * MARKER
   * ========================================
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!position) {
      markerRef.current?.remove();

      markerRef.current = null;

      return;
    }

    const latLng: L.LatLngExpression = [position[1], position[0]];

    /*
     * Marker قبلی فقط جابه‌جا شود.
     */
    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);

      return;
    }

    const marker = L.marker(latLng, {
      draggable: draggableMarker && interactive,

      icon: createLocationIcon(),
    }).addTo(map);

    marker.on("dragend", () => {
      const value = marker.getLatLng();

      onLocationChangeRef.current?.([value.lng, value.lat]);
    });

    markerRef.current = marker;
  }, [position, draggableMarker, interactive]);

  /*
   * ========================================
   * FLY TO
   * ========================================
   */

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !position) {
      return;
    }

    map.flyTo([position[1], position[0]], SELECTED_LOCATION_ZOOM, {
      duration: 0.9,
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
      <div
        ref={containerRef}
        className="
          h-full
          w-full
        "
      />
    </div>
  );
}

function createLocationIcon() {
  return L.divIcon({
    className: "funima-leaflet-marker",

    html: `
      <div class="funima-map-pin">
        <div class="funima-map-pin-shadow"></div>

        <div class="funima-map-pin-body">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"
            ></path>

            <circle
              cx="12"
              cy="10"
              r="3"
            ></circle>
          </svg>
        </div>
      </div>
    `,

    iconSize: [44, 52],

    iconAnchor: [22, 52],
  });
}
