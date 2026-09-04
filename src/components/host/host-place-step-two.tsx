"use client";

import { useState } from "react";

import { FiCheckCircle, FiMapPin } from "react-icons/fi";

import { LocationPicker } from "@/components/map";

import {
  Button,
  FormField,
  ImageUploader,
  InlineMessage,
  Input,
  Text,
  Textarea,
} from "@/components/ui";

import type { LngLat } from "@/lib/map/types";

import { trpc } from "@/trpc/client";

type Props = {
  place: {
    id: string;

    description: string | null;

    location: {
      id: string;

      title: string | null;

      address: string | null;

      latitude: number;

      longitude: number;
    } | null;

    images: Array<{
      id: string;

      url: string;

      sortOrder: number;
    }>;
  };

  onCompleted: () => void | Promise<unknown>;
};

export function HostPlaceStepTwo({ place, onCompleted }: Props) {
  const utils = trpc.useUtils();

  const locationUpsert = trpc.host.place.locationUpsert.useMutation();

  const deleteImage = trpc.host.place.deleteImage.useMutation();

  const filterOptions = trpc.host.place.filterOptions.useQuery();

  const setFilterValues = trpc.host.place.setFilterValues.useMutation();

  const [title, setTitle] = useState(place.location?.title ?? "");

  const [address, setAddress] = useState(place.location?.address ?? "");

  /*
   * LocationPicker از فرمت:
   *
   * [longitude, latitude]
   *
   * استفاده می‌کند.
   */
  const [position, setPosition] = useState<LngLat | null>(
    place.location ? [place.location.longitude, place.location.latitude] : null,
  );

  const [description] = useState(place.description ?? "");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const currentSelectedIds =
    selectedIds.length > 0
      ? selectedIds
      : (filterOptions.data?.selectedIds ?? []);

  const loading = locationUpsert.isPending || setFilterValues.isPending;

  function toggleFilter(id: string) {
    setSelectedIds((current) => {
      const base =
        current.length > 0 ? current : (filterOptions.data?.selectedIds ?? []);

      if (base.includes(id)) {
        return base.filter((item) => item !== id);
      }

      return [...base, id];
    });
  }

  async function refetchPlace() {
    await utils.host.place.getMine.invalidate();
  }

  async function handleDeleteImage(imageId: string) {
    const confirmed = window.confirm("این تصویر حذف شود؟");

    if (!confirmed) {
      return;
    }

    try {
      await deleteImage.mutateAsync({
        imageId,
      });

      await refetchPlace();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف تصویر انجام نشد.");
    }
  }

  async function handleComplete() {
    setError(null);

    setSuccess(null);

    /*
     * پروفایل بدون حداقل
     * سه تصویر کامل نمی‌شود.
     */
    if (place.images.length < 3) {
      setError("برای تکمیل پروفایل حداقل ۳ تصویر آپلود کنید.");

      return;
    }

    /*
     * دیگر latitude / longitude
     * را از Input نمی‌گیریم.
     *
     * Host باید یک نقطه واقعی
     * روی LocationPicker انتخاب کند.
     */
    if (!position) {
      setError("لطفاً موقعیت دقیق مکان را روی نقشه انتخاب کنید.");

      return;
    }

    const [longitude, latitude] = position;

    /*
     * یک validation ساده Client-side.
     */
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
       * ابتدا Location ذخیره می‌شود.
       */
      await locationUpsert.mutateAsync({
        title: title.trim(),

        address: address.trim(),

        latitude,

        longitude,
      });

      /*
       * سپس ویژگی‌های Place
       * ذخیره می‌شوند.
       */
      await setFilterValues.mutateAsync({
        filterValueIds: currentSelectedIds,
      });

      setSuccess("پروفایل کسب‌وکار با موفقیت تکمیل شد.");

      /*
       * اطلاعات Host Place
       * از cache خارج می‌شود
       * تا اطلاعات جدید دریافت شود.
       */
      await refetchPlace();

      await onCompleted();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "تکمیل پروفایل انجام نشد.",
      );
    }
  }

  return (
    <div className="space-y-6">
      {/*
       * ========================================
       * HEADER
       * ========================================
       */}

      <div className="text-center">
        <Text as="h1" variant="heading-xl">
          تکمیل پروفایل
        </Text>

        <Text tone="secondary" className="mt-2">
          تصاویر، موقعیت و ویژگی‌های مکان را تکمیل کنید
        </Text>
      </div>

      <div
        className="
          mx-auto
          max-w-3xl
          space-y-6
        "
      >
        {/*
         * ========================================
         * IMAGES
         * ========================================
         */}

        <section
          className="
            rounded-3xl
            border
            border-(--color-border)
            bg-(--color-surface)
            p-5
            sm:p-7
          "
        >
          <ImageUploader
            placeId={place.id}
            images={place.images}
            maxFiles={8}
            onUploaded={refetchPlace}
            onDelete={handleDeleteImage}
          />

          <Text variant="caption" tone="secondary" className="mt-3">
            برای تکمیل پروفایل حداقل ۳ تصویر لازم است.
          </Text>
        </section>

        {/*
         * ========================================
         * LOCATION
         * ========================================
         */}

        <section
          className="
            rounded-3xl
            border
            border-(--color-border)
            bg-(--color-surface)
            p-5
            sm:p-7
          "
        >
          <div
            className="
              mb-5
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
              <Text variant="heading-md">موقعیت مکان</Text>

              <Text tone="secondary" className="mt-1">
                موقعیت دقیق کسب‌وکار را روی نقشه مشخص کنید.
              </Text>
            </div>
          </div>

          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
            "
          >
            <FormField label="عنوان موقعیت">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={loading}
                placeholder="مثلاً شعبه ولیعصر"
              />
            </FormField>

            <FormField label="آدرس">
              <Input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                disabled={loading}
                placeholder="آدرس کامل مکان"
              />
            </FormField>
          </div>

          <div className="mt-6">
            <LocationPicker
              value={position}
              onChange={setPosition}
              disabled={loading}
              title="انتخاب موقعیت دقیق"
              description="مکان را جستجو کنید، از موقعیت فعلی استفاده کنید یا نشانگر را روی نقشه جابه‌جا کنید."
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
         * DESCRIPTION
         * ========================================
         */}

        <section
          className="
            rounded-3xl
            border
            border-(--color-border)
            bg-(--color-surface)
            p-5
            sm:p-7
          "
        >
          <div className="mb-5">
            <Text variant="heading-md">معرفی مکان</Text>

            <Text tone="secondary" className="mt-1">
              معرفی فعلی شما
            </Text>
          </div>

          <Textarea value={description} resize={false} disabled />

          <Text variant="caption" tone="secondary" className="mt-2">
            ویرایش معرفی را در صفحه حساب میزبان انجام می‌دهیم.
          </Text>
        </section>

        {/*
         * ========================================
         * FILTERS
         * ========================================
         */}

        <section
          className="
            rounded-3xl
            border
            border-(--color-border)
            bg-(--color-surface)
            p-5
            sm:p-7
          "
        >
          <Text variant="heading-md">ویژگی‌های مکان</Text>

          <Text tone="secondary" className="mt-1">
            ویژگی‌های مرتبط با کسب‌وکار خود را انتخاب کنید.
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
         * COMPLETE
         * ========================================
         */}

        <Button
          type="button"
          size="xl"
          fullWidth
          startIcon={<FiCheckCircle />}
          loading={loading}
          disabled={deleteImage.isPending}
          onClick={handleComplete}
        >
          تکمیل و ثبت پروفایل
        </Button>
      </div>
    </div>
  );
}
