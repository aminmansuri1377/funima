import type { LngLat } from "./types";

export const DEFAULT_MAP_CENTER: LngLat = [53.688, 32.4279];

export const DEFAULT_MAP_ZOOM = 5;

export const SELECTED_LOCATION_ZOOM = 16;

/*
 * فعلاً OpenStreetMap.
 *
 * بعداً provider می‌تواند Neshan شود.
 */
export const DEFAULT_MAP_PROVIDER = "openstreetmap" as const;
