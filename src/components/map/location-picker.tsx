"use client";

import { useState } from "react";

import { FiCrosshair, FiMapPin } from "react-icons/fi";

import { Button, InlineMessage, Text } from "@/components/ui";

import { useUserLocation } from "@/hooks/map/use-user-location";

import type { MapSearchResult } from "@/lib/map/search-types";

import type { LngLat, MapProviderName } from "@/lib/map/types";

import { LocationSearch } from "./location-search";

import { MapView } from "./map-view";

type LocationPickerProps = {
  value: LngLat | null;

  onChange: (value: LngLat) => void;

  disabled?: boolean;

  showSearch?: boolean;

  showCurrentLocation?: boolean;

  showNavigation?: boolean;

  mapHeightClassName?: string;

  title?: string;

  description?: string;

  provider?: MapProviderName;
};

export function LocationPicker({
  value,

  onChange,

  disabled = false,

  showSearch = true,

  showCurrentLocation = true,

  showNavigation = true,

  mapHeightClassName = "h-[280px] sm:h-[380px] lg:h-[440px]",

  title = "موقعیت دقیق روی نقشه",

  description = "مکان را جستجو کنید، روی نقشه بزنید یا نشانگر را جابه‌جا کنید.",

  provider = "openstreetmap",
}: LocationPickerProps) {
  const userLocation = useUserLocation();

  const [error, setError] = useState<string | null>(null);

  const [selectedResult, setSelectedResult] = useState<MapSearchResult | null>(
    null,
  );

  async function handleLocateMe() {
    if (disabled || userLocation.isLoading) {
      return;
    }

    setError(null);

    const result = await userLocation.locate();

    if (!result) {
      setError(getLocationErrorMessage(userLocation.error));

      return;
    }

    onChange(result.position);

    setSelectedResult(null);
  }

  function handleSearchSelect(result: MapSearchResult) {
    setError(null);

    setSelectedResult(result);

    onChange(result.position);
  }

  function handleMapLocationChange(position: LngLat) {
    setError(null);

    setSelectedResult(null);

    onChange(position);
  }

  return (
    <div className="space-y-4">
      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div>
          <Text variant="heading-md">{title}</Text>

          <Text variant="body-sm" tone="secondary" className="mt-1">
            {description}
          </Text>
        </div>

        {showCurrentLocation && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            startIcon={<FiCrosshair />}
            loading={userLocation.isLoading}
            disabled={disabled}
            onClick={handleLocateMe}
          >
            موقعیت فعلی من
          </Button>
        )}
      </div>

      {showSearch && (
        <LocationSearch
          disabled={disabled}
          userPosition={userLocation.position}
          onSelect={handleSearchSelect}
        />
      )}

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      <div
        className={`
          relative
          overflow-hidden
          rounded-3xl
          border
          border-(--color-border)
          bg-gray-100
          ${mapHeightClassName}
        `}
      >
        <MapView
          position={value}
          interactive={!disabled}
          draggableMarker={!disabled}
          showNavigation={showNavigation}
          provider={provider}
          onLocationChange={handleMapLocationChange}
        />

        {!value && !disabled && (
          <div
            className="
                pointer-events-none
                absolute
                left-1/2
                top-3
                z-500
                -translate-x-1/2
                whitespace-nowrap
                rounded-full
                bg-white/95
                px-3
                py-2
                text-xs
                font-medium
                shadow-md
              "
          >
            روی نقشه نقطه را انتخاب کنید
          </div>
        )}
      </div>

      {selectedResult && (
        <div
          className="
            flex
            items-start
            gap-3
            rounded-[18px]
            border
            border-(--color-border)
            bg-white
            p-3
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-(--color-brand-50)
              text-(--color-brand-600)
            "
          >
            <FiMapPin />
          </div>

          <div className="min-w-0">
            <Text variant="label-md">{selectedResult.name}</Text>

            {selectedResult.label && (
              <Text
                variant="caption"
                tone="secondary"
                className="
                  mt-1
                  leading-5
                "
              >
                {selectedResult.label}
              </Text>
            )}
          </div>
        </div>
      )}

      {userLocation.position && userLocation.accuracy !== null && (
        <div
          className="
              rounded-[18px]
              bg-[#f8f8f8]
              px-4
              py-3
            "
        >
          <Text variant="caption" tone="secondary">
            دقت موقعیت فعلی دستگاه:{" "}
            {Math.round(userLocation.accuracy).toLocaleString("fa-IR")} متر
          </Text>
        </div>
      )}

      {value && (
        <div
          className="
            flex
            items-center
            gap-3
            rounded-[18px]
            bg-(--color-brand-50)
            p-3
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white
              text-(--color-brand-600)
              shadow-sm
            "
          >
            <FiMapPin />
          </div>

          <div className="min-w-0">
            <Text variant="caption" tone="secondary">
              مختصات انتخاب‌شده
            </Text>

            <Text
              dir="ltr"
              variant="body-sm"
              className="
                mt-1
                text-left
              "
            >
              {value[1].toFixed(7)}, {value[0].toFixed(7)}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}

function getLocationErrorMessage(
  error:
    | "UNSUPPORTED"
    | "PERMISSION_DENIED"
    | "POSITION_UNAVAILABLE"
    | "TIMEOUT"
    | "UNKNOWN"
    | null,
) {
  switch (error) {
    case "UNSUPPORTED":
      return "مرورگر شما دریافت موقعیت مکانی را پشتیبانی نمی‌کند.";

    case "PERMISSION_DENIED":
      return "اجازه دسترسی به موقعیت مکانی داده نشد.";

    case "POSITION_UNAVAILABLE":
      return "موقعیت فعلی دستگاه قابل دریافت نیست.";

    case "TIMEOUT":
      return "دریافت موقعیت بیش از حد طول کشید.";

    default:
      return "دریافت موقعیت فعلی انجام نشد.";
  }
}
