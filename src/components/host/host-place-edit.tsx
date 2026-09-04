"use client";

import { useMemo, useState } from "react";

import { FiMapPin, FiSave, FiX } from "react-icons/fi";

import { LocationPicker } from "@/components/map";

import {
  Button,
  FormField,
  InlineMessage,
  Input,
  SearchSelect,
  Text,
  Textarea,
} from "@/components/ui";

import {
  PLACE_TYPE_OPTIONS,
  type PlaceTypeValue,
} from "@/lib/place/place-type";

import type { LngLat } from "@/lib/map/types";

import { trpc } from "@/trpc/client";

type HostPlaceEditProps = {
  place: {
    id: string;

    placeName: string;

    placePhone: string | null;

    placeType: PlaceTypeValue;

    placeProvince: string | null;

    placeCity: string | null;

    instagramId: string | null;

    description: string | null;

    location: {
      id: string;

      title: string | null;

      address: string | null;

      latitude: number;

      longitude: number;
    } | null;

    filterValues: Array<{
      filterValue: {
        id: string;

        name: string;

        filter: {
          id: string;

          name: string;
        };
      };
    }>;
  };

  onCancel: () => void;

  onChanged: () => void | Promise<unknown>;

  onSaved: () => void | Promise<unknown>;
};

export function HostPlaceEdit({
  place,
  onCancel,
  onChanged,
  onSaved,
}: HostPlaceEditProps) {
  const utils = trpc.useUtils();

  const updatePlace = trpc.host.place.update.useMutation();

  const updateLocation = trpc.host.place.locationUpsert.useMutation();

  const filterOptions = trpc.host.place.filterOptions.useQuery();

  const setFilterValues = trpc.host.place.setFilterValues.useMutation();

  const [placeName, setPlaceName] = useState(place.placeName);

  const [placePhone, setPlacePhone] = useState(place.placePhone ?? "");

  const [placeType, setPlaceType] = useState<PlaceTypeValue>(place.placeType);

  const [placeProvince, setPlaceProvince] = useState(place.placeProvince ?? "");

  const [placeCity, setPlaceCity] = useState(place.placeCity ?? "");

  const [instagramId, setInstagramId] = useState(place.instagramId ?? "");

  const [description, setDescription] = useState(place.description ?? "");

  const [locationTitle, setLocationTitle] = useState(
    place.location?.title ?? "",
  );

  const [locationAddress, setLocationAddress] = useState(
    place.location?.address ?? "",
  );

  /*
   * LocationPicker:
   *
   * [longitude, latitude]
   */
  const [position, setPosition] = useState<LngLat | null>(
    place.location ? [place.location.longitude, place.location.latitude] : null,
  );

  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>(
    place.filterValues.map((item) => item.filterValue.id),
  );

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  /*
   * اگر API فیلترها هنوز لود نشده،
   * انتخاب‌های فعلی place را داریم.
   */
  const currentSelectedIds = selectedFilterIds;

  const loading =
    updatePlace.isPending ||
    updateLocation.isPending ||
    setFilterValues.isPending;

  /*
   * فعلاً options استان/شهر را از داده‌های فعلی
   * ساده نگه می‌داریم.
   *
   * اگر همان dataset ایران که در PlaceManager
   * استفاده کردی import جدا دارد،
   * بعداً همین دو array را با آن جایگزین کن.
   */
  const provinceOptions = useMemo(() => {
    const values = new Set<string>();

    if (place.placeProvince) {
      values.add(place.placeProvince);
    }

    return Array.from(values).map((value) => ({
      value,

      label: value,
    }));
  }, [place.placeProvince]);

  const cityOptions = useMemo(() => {
    const values = new Set<string>();

    if (place.placeCity) {
      values.add(place.placeCity);
    }

    return Array.from(values).map((value) => ({
      value,

      label: value,
    }));
  }, [place.placeCity]);

  function toggleFilter(id: string) {
    setSelectedFilterIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  }

  async function handleSave() {
    setError(null);

    setSuccess(null);

    if (!placeName.trim()) {
      setError("نام مکان الزامی است.");

      return;
    }

    if (!placeProvince.trim()) {
      setError("استان الزامی است.");

      return;
    }

    if (!placeCity.trim()) {
      setError("شهر الزامی است.");

      return;
    }

    if (!position) {
      setError("موقعیت دقیق مکان را روی نقشه انتخاب کنید.");

      return;
    }

    const [longitude, latitude] = position;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError("موقعیت انتخاب‌شده معتبر نیست.");

      return;
    }

    try {
      /*
       * ========================================
       * 1. اطلاعات اصلی Place
       * ========================================
       */
      await updatePlace.mutateAsync({
        placeName: placeName.trim(),

        placePhone: placePhone.trim(),

        placeType,

        placeProvince: placeProvince.trim(),

        placeCity: placeCity.trim(),

        instagramId: instagramId.trim(),

        description: description.trim(),
      });

      /*
       * ========================================
       * 2. Location
       * ========================================
       */
      await updateLocation.mutateAsync({
        title: locationTitle.trim(),

        address: locationAddress.trim(),

        latitude,

        longitude,
      });

      /*
       * ========================================
       * 3. Filter Values
       * ========================================
       */
      await setFilterValues.mutateAsync({
        filterValueIds: currentSelectedIds,
      });

      /*
       * ========================================
       * 4. Cache sync
       * ========================================
       */
      await utils.host.place.getMine.invalidate();

      await onChanged();

      setSuccess("اطلاعات مکان با موفقیت ذخیره شد.");

      await onSaved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "ذخیره تغییرات مکان انجام نشد.",
      );
    }
  }

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-3xl
        space-y-6
      "
    >
      {/*
       * ========================================
       * HEADER
       * ========================================
       */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            ویرایش مکان
          </Text>

          <Text tone="secondary" className="mt-1">
            اطلاعات کسب‌وکار و موقعیت مکانی را ویرایش کنید
          </Text>
        </div>

        <Button
          type="button"
          size="sm"
          variant="tertiary"
          startIcon={<FiX />}
          disabled={loading}
          onClick={onCancel}
        >
          انصراف
        </Button>
      </div>

      {/*
       * ========================================
       * BASIC INFO
       * ========================================
       */}

      <section
        className="
          rounded-[28px]
          bg-white
          p-5
          shadow-sm
          sm:p-7
        "
      >
        <Text variant="heading-md">اطلاعات اصلی</Text>

        <Text tone="secondary" className="mt-1">
          مشخصات کسب‌وکار را ویرایش کنید.
        </Text>

        <div
          className="
            mt-6
            grid
            gap-5
            sm:grid-cols-2
          "
        >
          <FormField label="نام مکان" required>
            <Input
              value={placeName}
              onChange={(event) => setPlaceName(event.target.value)}
              disabled={loading}
            />
          </FormField>

          <FormField label="نوع مکان" required>
            <SearchSelect
              value={placeType}
              options={PLACE_TYPE_OPTIONS}
              onChange={(value) => setPlaceType(value as PlaceTypeValue)}
              disabled={loading}
              placeholder="نوع مکان"
            />
          </FormField>

          <FormField label="شماره تماس">
            <Input
              value={placePhone}
              onChange={(event) => setPlacePhone(event.target.value)}
              type="tel"
              dir="ltr"
              className="text-left"
              disabled={loading}
            />
          </FormField>

          <FormField label="اینستاگرام">
            <Input
              value={instagramId}
              onChange={(event) => setInstagramId(event.target.value)}
              dir="ltr"
              className="text-left"
              placeholder="@..."
              disabled={loading}
            />
          </FormField>

          {/*
           * فعلاً این دو SearchSelect فقط مقدار فعلی را نگه می‌دارند.
           * اگر همان داده استان/شهر ایران را import جدا داری،
           * این دو options را به dataset کامل وصل کن.
           */}

          <FormField label="استان" required>
            <SearchSelect
              value={placeProvince}
              options={provinceOptions}
              onChange={(value) => {
                setPlaceProvince(value);

                /*
                 * اگر استان عوض شد،
                 * شهر باید reset شود.
                 */
                if (value !== placeProvince) {
                  setPlaceCity("");
                }
              }}
              disabled={loading}
              placeholder="استان"
              searchPlaceholder="جستجوی استان..."
            />
          </FormField>

          <FormField label="شهر" required>
            <SearchSelect
              value={placeCity}
              options={cityOptions}
              onChange={setPlaceCity}
              disabled={loading || !placeProvince}
              placeholder="شهر"
              searchPlaceholder="جستجوی شهر..."
            />
          </FormField>
        </div>

        <FormField label="توضیحات" className="mt-5">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            resize={false}
            disabled={loading}
          />
        </FormField>
      </section>

      {/*
       * ========================================
       * LOCATION
       * ========================================
       */}

      <section
        className="
          rounded-[28px]
          bg-white
          p-5
          shadow-sm
          sm:p-7
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
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

          <div>
            <Text variant="heading-md">موقعیت مکانی</Text>

            <Text tone="secondary" className="mt-1">
              موقعیت فعلی را مشاهده یا ویرایش کنید.
            </Text>
          </div>
        </div>

        <div
          className="
            mt-6
            grid
            gap-5
            sm:grid-cols-2
          "
        >
          <FormField label="عنوان موقعیت">
            <Input
              value={locationTitle}
              onChange={(event) => setLocationTitle(event.target.value)}
              placeholder="مثلاً شعبه اصلی"
              disabled={loading}
            />
          </FormField>

          <FormField label="آدرس">
            <Input
              value={locationAddress}
              onChange={(event) => setLocationAddress(event.target.value)}
              placeholder="آدرس کامل"
              disabled={loading}
            />
          </FormField>
        </div>

        <div className="mt-6">
          <LocationPicker
            value={position}
            onChange={setPosition}
            disabled={loading}
            title="ویرایش موقعیت دقیق"
            description="موقعیت را جستجو کنید، از مکان فعلی استفاده کنید یا نشانگر را روی نقشه جابه‌جا کنید."
            mapHeightClassName="
              h-[260px]
              sm:h-[360px]
              lg:h-[420px]
            "
          />
        </div>
      </section>

      {/*
       * ========================================
       * FILTERS
       * ========================================
       */}

      <section
        className="
          rounded-[28px]
          bg-white
          p-5
          shadow-sm
          sm:p-7
        "
      >
        <Text variant="heading-md">ویژگی‌های مکان</Text>

        <Text tone="secondary" className="mt-1">
          ویژگی‌های مرتبط با کسب‌وکار را ویرایش کنید.
        </Text>

        {filterOptions.isPending && (
          <Text tone="secondary" className="mt-5">
            در حال دریافت ویژگی‌ها...
          </Text>
        )}

        {filterOptions.error && (
          <InlineMessage variant="error" className="mt-5">
            دریافت ویژگی‌ها انجام نشد.
          </InlineMessage>
        )}

        {filterOptions.data && (
          <div
            className="
              mt-6
              space-y-7
            "
          >
            {filterOptions.data.filters.map((filter) => (
              <div key={filter.id}>
                <Text variant="label-lg">{filter.name}</Text>

                <div
                  className="
                      mt-3
                      flex
                      flex-wrap
                      gap-2
                    "
                >
                  {filter.values.map((value) => {
                    const selected = currentSelectedIds.includes(value.id);

                    return (
                      <button
                        key={value.id}
                        type="button"
                        aria-pressed={selected}
                        disabled={loading}
                        onClick={() => toggleFilter(value.id)}
                        className={`
                              rounded-full
                              border
                              px-4
                              py-2
                              text-sm
                              font-semibold
                              transition-colors

                              disabled:cursor-not-allowed
                              disabled:opacity-60

                              ${
                                selected
                                  ? "border-(--color-brand-500) bg-(--color-brand-500) text-white"
                                  : "border-(--color-border) bg-white hover:border-(--color-brand-300)"
                              }
                            `}
                      >
                        {value.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/*
       * ========================================
       * MESSAGES
       * ========================================
       */}

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {success && <InlineMessage variant="success">{success}</InlineMessage>}

      {/*
       * ========================================
       * ACTIONS
       * ========================================
       */}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
        "
      >
        <Button
          type="button"
          size="xl"
          fullWidth
          startIcon={<FiSave />}
          loading={loading}
          onClick={handleSave}
        >
          ذخیره تغییرات
        </Button>

        <Button
          type="button"
          size="xl"
          variant="tertiary"
          fullWidth
          disabled={loading}
          onClick={onCancel}
        >
          انصراف
        </Button>
      </div>
    </div>
  );
}
