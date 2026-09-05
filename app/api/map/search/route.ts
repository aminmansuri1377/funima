import { NextRequest, NextResponse } from "next/server";

import type { MapSearchResult } from "@/lib/map/search-types";

type NominatimItem = {
  place_id: number | string;

  osm_type?: string;

  osm_id?: number | string;

  lat?: string;

  lon?: string;

  display_name?: string;

  name?: string;

  address?: {
    road?: string;

    pedestrian?: string;

    neighbourhood?: string;

    suburb?: string;

    city_district?: string;

    city?: string;

    town?: string;

    village?: string;

    county?: string;

    state?: string;

    postcode?: string;

    country?: string;
  };
};

const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({
      items: [],
    });
  }

  const latitude = parseOptionalNumber(searchParams.get("lat"));

  const longitude = parseOptionalNumber(searchParams.get("lon"));

  const params = new URLSearchParams({
    q: query,

    format: "jsonv2",

    addressdetails: "1",

    limit: "8",

    countrycodes: "ir",

    "accept-language": "fa,en",
  });

  /*
   * اگر موقعیت کاربر را داریم،
   * viewbox کوچکی اطرافش می‌دهیم
   * تا نتایج نزدیک‌تر اولویت بگیرند.
   *
   * bounded=0 یعنی خارج از این محدوده
   * هم همچنان نتیجه مجاز است.
   */
  if (latitude !== null && longitude !== null) {
    const delta = 0.35;

    const left = longitude - delta;

    const right = longitude + delta;

    const top = latitude + delta;

    const bottom = latitude - delta;

    params.set("viewbox", `${left},${top},${right},${bottom}`);

    params.set("bounded", "0");
  }

  const url = `${NOMINATIM_API}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",

        /*
         * Nominatim Public API
         * بهتر است User-Agent مشخص داشته باشد.
         */
        "User-Agent": "Funima/1.0",
      },

      cache: "no-store",

      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const responseText = await response.text();

      console.error("[Map Search] Nominatim error", {
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

    const data = (await response.json()) as NominatimItem[];

    const items = normalizeItems(data);

    return NextResponse.json({
      items,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      console.error("[Map Search] Nominatim timeout", {
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

function normalizeItems(items: NominatimItem[]): MapSearchResult[] {
  const result: MapSearchResult[] = [];

  const seen = new Set<string>();

  for (const item of items) {
    const longitude = Number(item.lon);

    const latitude = Number(item.lat);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      continue;
    }

    const address = item.address ?? {};

    const city =
      cleanString(address.city) ??
      cleanString(address.town) ??
      cleanString(address.village) ??
      cleanString(address.county);

    const street = cleanString(address.road) ?? cleanString(address.pedestrian);

    const name =
      cleanString(item.name) ??
      street ??
      city ??
      firstDisplayNamePart(item.display_name) ??
      "مکان بدون نام";

    const id = [item.osm_type ?? "place", item.osm_id ?? item.place_id].join(
      "-",
    );

    const signature = [id, longitude.toFixed(6), latitude.toFixed(6)].join(":");

    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);

    result.push({
      id,

      name,

      label:
        cleanString(item.display_name) ??
        buildLabel({
          name,

          street,

          city,

          state: cleanString(address.state),

          country: cleanString(address.country),
        }),

      position: [longitude, latitude],

      city,

      state: cleanString(address.state),

      country: cleanString(address.country),

      street,

      postcode: cleanString(address.postcode),
    });
  }

  return result;
}

function buildLabel({
  name,
  street,
  city,
  state,
  country,
}: {
  name: string;

  street: string | null;

  city: string | null;

  state: string | null;

  country: string | null;
}) {
  const values = [name, street, city, state, country];

  const parts: string[] = [];

  for (const value of values) {
    const normalized = cleanString(value);

    if (!normalized || parts.includes(normalized)) {
      continue;
    }

    parts.push(normalized);
  }

  return parts.join("، ");
}

function firstDisplayNamePart(value: string | undefined) {
  const normalized = cleanString(value);

  if (!normalized) {
    return null;
  }

  return normalized.split(",")[0]?.trim() || null;
}

function cleanString(value: string | null | undefined) {
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
