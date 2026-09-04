"use client";

import { useState } from "react";

import { FiCheckCircle, FiMapPin } from "react-icons/fi";

import {
  Button,
  FormField,
  ImageUploader,
  InlineMessage,
  Input,
  Text,
  Textarea,
} from "@/components/ui";

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

  const updatePlace = trpc.host.place.update.useMutation();

  const deleteImage = trpc.host.place.deleteImage.useMutation();

  const filterOptions = trpc.host.place.filterOptions.useQuery();

  const setFilterValues = trpc.host.place.setFilterValues.useMutation();

  const [title, setTitle] = useState(place.location?.title ?? "");

  const [address, setAddress] = useState(place.location?.address ?? "");

  const [latitude, setLatitude] = useState(
    place.location?.latitude?.toString() ?? "",
  );

  const [longitude, setLongitude] = useState(
    place.location?.longitude?.toString() ?? "",
  );

  const [description, setDescription] = useState(place.description ?? "");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const currentSelectedIds =
    selectedIds.length > 0
      ? selectedIds
      : (filterOptions.data?.selectedIds ?? []);

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

    await deleteImage.mutateAsync({
      imageId,
    });

    await refetchPlace();
  }

  async function handleComplete() {
    setError(null);
    setSuccess(null);

    if (place.images.length < 3) {
      setError("برای تکمیل پروفایل حداقل ۳ تصویر آپلود کنید.");

      return;
    }

    const latitudeNumber = Number(latitude);

    const longitudeNumber = Number(longitude);

    if (
      !latitude.trim() ||
      !longitude.trim() ||
      Number.isNaN(latitudeNumber) ||
      Number.isNaN(longitudeNumber)
    ) {
      setError("موقعیت جغرافیایی معتبر وارد کنید.");

      return;
    }

    try {
      await locationUpsert.mutateAsync({
        title: title.trim(),

        address: address.trim(),

        latitude: latitudeNumber,

        longitude: longitudeNumber,
      });

      /*
       * چون update فعلی Host تمام اطلاعات
       * Place را لازم دارد، description را
       * فعلاً در Step 1 ثبت کرده‌ایم.
       *
       * اگر بعداً description مستقل خواستیم،
       * mutation مخصوص آن می‌سازیم.
       */

      await setFilterValues.mutateAsync({
        filterValueIds: currentSelectedIds,
      });

      setSuccess("پروفایل کسب‌وکار با موفقیت تکمیل شد.");

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
          <div className="mb-5 flex items-start gap-3">
            <div
              className="
                flex h-11 w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-(--color-brand-50)
                text-(--color-brand-600)
              "
            >
              <FiMapPin />
            </div>

            <div>
              <Text variant="heading-md">موقعیت دقیق مکان</Text>

              <Text tone="secondary" className="mt-1">
                فعلاً مختصات را وارد کنید؛ Map Picker را در مرحله بعد جایگزین
                می‌کنیم.
              </Text>
            </div>
          </div>

          <div
            className="
              grid gap-5
              sm:grid-cols-2
            "
          >
            <FormField label="عنوان موقعیت">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="مثلاً شعبه اصلی"
              />
            </FormField>

            <FormField label="آدرس">
              <Input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="آدرس کامل"
              />
            </FormField>

            <FormField label="عرض جغرافیایی" required>
              <Input
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                dir="ltr"
                className="text-left"
                placeholder="35.6892"
              />
            </FormField>

            <FormField label="طول جغرافیایی" required>
              <Input
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                dir="ltr"
                className="text-left"
                placeholder="51.3890"
              />
            </FormField>
          </div>
        </section>

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

          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            resize={false}
            disabled
          />

          <Text variant="caption" tone="secondary" className="mt-2">
            ویرایش معرفی را در صفحه حساب میزبان فعال می‌کنیم.
          </Text>
        </section>

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
            <div className="mt-6 space-y-7">
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
                          onClick={() => toggleFilter(value.id)}
                          className={`
                                rounded-full
                                border
                                px-4
                                py-2
                                text-sm
                                font-semibold
                                transition-colors

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

        {error && <InlineMessage variant="error">{error}</InlineMessage>}

        {success && <InlineMessage variant="success">{success}</InlineMessage>}

        <Button
          type="button"
          size="xl"
          fullWidth
          startIcon={<FiCheckCircle />}
          loading={locationUpsert.isPending || setFilterValues.isPending}
          onClick={handleComplete}
        >
          تکمیل و ثبت پروفایل
        </Button>
      </div>
    </div>
  );
}
