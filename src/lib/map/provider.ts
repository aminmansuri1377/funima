import type { MapProviderName } from "./types";

export type MapTileProvider = {
  name: MapProviderName;

  url: string;

  attribution: string;

  maxZoom: number;

  subdomains?: string | string[];
};

/*
 * ========================================
 * OPENSTREETMAP
 * ========================================
 */

const openStreetMapProvider: MapTileProvider = {
  name: "openstreetmap",

  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

  maxZoom: 19,
};

/*
 * ========================================
 * NESHAN
 * ========================================
 *
 * فعلاً provider نشان را فعال نمی‌کنیم.
 *
 * بعداً API Key و endpoint رسمی را
 * اینجا اضافه می‌کنیم.
 */
const neshanProvider: MapTileProvider | null = null;

export function getMapProvider(
  provider: MapProviderName = "openstreetmap",
): MapTileProvider {
  if (provider === "neshan" && neshanProvider) {
    return neshanProvider;
  }

  return openStreetMapProvider;
}
