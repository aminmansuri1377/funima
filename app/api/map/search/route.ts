import { NextRequest, NextResponse } from "next/server";

import type { MapSearchResult } from "@/lib/map/search-types";

type PhotonFeature = {
  type: "Feature";

  geometry?: {
    type?: string;

    coordinates?: unknown;
  };

  properties?: {
    osm_type?: string;

    osm_id?: number | string;

    name?: string;

    street?: string;

    housenumber?: string;

    district?: string;

    city?: string;

    county?: string;

    state?: string;

    country?: string;

    postcode?: string;
  };
};

type PhotonResponse = {
  type?: string;

  features?: PhotonFeature[];
};

const PHOTON_API = "https://photon.komoot.io/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get("q")?.trim() ?? "";

  /*
   * Queryهای خیلی کوتاه
   * ارسال نمی‌شوند.
   */
  if (query.length < 2) {
    return NextResponse.json({
      items: [],
    });
  }

  const latitude = parseOptionalNumber(searchParams.get("lat"));

  const longitude = parseOptionalNumber(searchParams.get("lon"));

  const params = new URLSearchParams();

  params.set("q", query);

  params.set("limit", "6");

  /*
   * فقط ایران
   */
  params.set("countrycode", "IR");

  /*
   * نکته مهم:
   *
   * عمداً lang=fa نمی‌فرستیم.
   *
   * Photon در این حالت می‌تواند
   * نام local ذخیره‌شده در OSM
   * را برگرداند.
   */

  if (latitude !== null && longitude !== null) {
    params.set("lat", String(latitude));

    params.set("lon", String(longitude));

    /*
     * نتیجه‌های اطراف موقعیت فعلی
     * کمی اولویت بیشتری بگیرند.
     */
    params.set("zoom", "12");
  }

  const url = `${PHOTON_API}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },

      cache: "no-store",

      signal: AbortSignal.timeout(10_000),
    });

    /*
     * اگر Photon خطا داد،
     * body واقعی را هم در Terminal
     * چاپ می‌کنیم تا debugging راحت باشد.
     */
    if (!response.ok) {
      const responseText = await response.text();

      console.error("[Map Search] Photon error", {
        status: response.status,

        statusText: response.statusText,

        url,

        response: responseText,
      });

      return NextResponse.json(
        {
          error: "SEARCH_PROVIDER_ERROR",
        },
        {
          status: 502,
        },
      );
    }

    const data = (await response.json()) as PhotonResponse;

    const items = normalizeFeatures(data.features ?? []);

    return NextResponse.json({
      items,
    });
  } catch (error) {
    /*
     * AbortSignal.timeout()
     */
    if (error instanceof DOMException && error.name === "TimeoutError") {
      console.error("[Map Search] Photon timeout", {
        url,
      });

      return NextResponse.json(
        {
          error: "SEARCH_TIMEOUT",
        },
        {
          status: 504,
        },
      );
    }

    console.error("[Map Search]", error);

    return NextResponse.json(
      {
        error: "SEARCH_FAILED",
      },
      {
        status: 502,
      },
    );
  }
}

function normalizeFeatures(features: PhotonFeature[]): MapSearchResult[] {
  const result: MapSearchResult[] = [];

  for (const feature of features) {
    const coordinates = feature.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      continue;
    }

    const longitude = Number(coordinates[0]);

    const latitude = Number(coordinates[1]);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      continue;
    }

    const properties = feature.properties ?? {};

    const name =
      cleanString(properties.name) ??
      cleanString(properties.street) ??
      cleanString(properties.city) ??
      "مکان بدون نام";

    const id = [
      properties.osm_type ?? "place",

      properties.osm_id ?? `${longitude}-${latitude}`,
    ].join("-");

    result.push({
      id,

      name,

      label: buildLabel(properties, name),

      position: [longitude, latitude],

      city: cleanString(properties.city),

      state: cleanString(properties.state),

      country: cleanString(properties.country),

      street: cleanString(properties.street),

      postcode: cleanString(properties.postcode),
    });
  }

  return result;
}

function buildLabel(
  properties: NonNullable<PhotonFeature["properties"]>,
  fallbackName: string,
) {
  const candidates = [
    fallbackName,

    properties.housenumber && properties.street
      ? `${properties.street} ${properties.housenumber}`
      : properties.street,

    properties.district,

    properties.city,

    properties.county,

    properties.state,
  ];

  const parts: string[] = [];

  for (const candidate of candidates) {
    const value = cleanString(candidate);

    if (!value) {
      continue;
    }

    if (!parts.includes(value)) {
      parts.push(value);
    }
  }

  return parts.join("، ");
}

function cleanString(value: string | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function parseOptionalNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}
