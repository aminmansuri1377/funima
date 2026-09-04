"use client";

import { useMemo, useState } from "react";

import { getCities, getProvincesList } from "@code-plate/iran-cities";

import { FiArrowRight, FiMapPin, FiSave } from "react-icons/fi";

import {
  Button,
  FormField,
  ImageUploader,
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

import { trpc } from "@/trpc/client";

import type { HostPlaceData } from "./host-account-view";

type Props = {
  place: HostPlaceData;

  onCancel: () => void;

  onChanged: () => void | Promise<unknown>;

  onSaved: () => void | Promise<unknown>;
};

export function HostPlaceEdit({ place, onCancel, onChanged, onSaved }: Props) {
  const [placeName, setPlaceName] = useState(place.placeName);

  const [placeType, setPlaceType] = useState<PlaceTypeValue>(place.placeType);

  const [placePhone, setPlacePhone] = useState(place.placePhone ?? "");

  const [instagramId, setInstagramId] = useState(place.instagramId ?? "");

  const [description, setDescription] = useState(place.description ?? "");

  const [locationTitle, setLocationTitle] = useState(
    place.location?.title ?? "",
  );

  const [address, setAddress] = useState(place.location?.address ?? "");

  const [latitude, setLatitude] = useState(
    place.location?.latitude?.toString() ?? "",
  );

  const [longitude, setLongitude] = useState(
    place.location?.longitude?.toString() ?? "",
  );

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const provinces = useMemo(() => getProvincesList(), []);

  const initialProvince = provinces.find(
    (item) => item.fa === place.placeProvince,
  );

  const [province, setProvince] = useState(initialProvince?.en ?? "");

  const cities = useMemo(
    () => (province ? getCities(province) : []),
    [province],
  );

  const initialCity = cities.find((item) => item.fa === place.placeCity);

  const [city, setCity] = useState(initialCity?.en ?? "");

  const provinceOptions = useMemo(
    () =>
      provinces.map((item) => ({
        value: item.en,
        label: item.fa,
      })),
    [provinces],
  );

  const cityOptions = useMemo(
    () =>
      cities.map((item) => ({
        value: item.en,
        label: item.fa,
      })),
    [cities],
  );

  const selectedProvince = provinces.find((item) => item.en === province);

  const selectedCity = cities.find((item) => item.en === city);

  const update = trpc.host.place.update.useMutation();

  const locationUpsert = trpc.host.place.locationUpsert.useMutation();

  const deleteImage = trpc.host.place.deleteImage.useMutation();

  const filters = trpc.host.place.filterOptions.useQuery();

  async function refresh() {
    await onChanged();
  }

  async function handleDeleteImage(imageId: string) {
    const confirmed = window.confirm("این تصویر حذف شود؟");

    if (!confirmed) {
      return;
    }

    await deleteImage.mutateAsync({
      imageId,
    });

    await refresh();
  }

  async function saveDetails() {
    setError(null);
    setSuccess(null);

    if (!selectedProvince || !selectedCity) {
      setError("استان و شهر را انتخاب کنید.");

      return;
    }

    try {
      await update.mutateAsync({
        placeName: placeName.trim(),

        placeType,

        placeProvince: selectedProvince.fa,

        placeCity: selectedCity.fa,

        placePhone: placePhone.trim(),

        instagramId: instagramId.trim(),

        description: description.trim(),
      });

      if (latitude.trim() && longitude.trim()) {
        const lat = Number(latitude);

        const lng = Number(longitude);

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          throw new Error("مختصات موقعیت معتبر نیست.");
        }

        await locationUpsert.mutateAsync({
          title: locationTitle.trim(),

          address: address.trim(),

          latitude: lat,
          longitude: lng,
        });
      }

      setSuccess("تغییرات با موفقیت ذخیره شد.");

      await onSaved();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ذخیره تغییرات انجام نشد.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div
        className="
          flex items-center
          justify-between
          gap-3
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            ویرایش حساب
          </Text>

          <Text tone="secondary" className="mt-1">
            اطلاعات کسب‌وکار خود را ویرایش کنید
          </Text>
        </div>

        <Button
          type="button"
          size="sm"
          variant="tertiary"
          startIcon={<FiArrowRight />}
          onClick={onCancel}
        >
          بازگشت
        </Button>
      </div>

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

        <div
          className="
            mt-6
            grid gap-5
            sm:grid-cols-2
          "
        >
          <FormField label="نام کسب‌وکار" required>
            <Input
              value={placeName}
              onChange={(event) => setPlaceName(event.target.value)}
            />
          </FormField>

          <FormField label="نوع کسب‌وکار" required>
            <SearchSelect
              value={placeType}
              options={PLACE_TYPE_OPTIONS}
              onChange={(value) => setPlaceType(value as PlaceTypeValue)}
            />
          </FormField>

          <FormField label="استان" required>
            <SearchSelect
              value={province}
              options={provinceOptions}
              onChange={(value) => {
                setProvince(value);

                setCity("");
              }}
              searchPlaceholder="جستجوی استان..."
            />
          </FormField>

          <FormField label="شهر" required>
            <SearchSelect
              value={city}
              options={cityOptions}
              onChange={setCity}
              disabled={!province}
              placeholder={
                province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"
              }
              searchPlaceholder="جستجوی شهر..."
            />
          </FormField>

          <FormField label="شماره تماس">
            <Input
              value={placePhone}
              onChange={(event) => setPlacePhone(event.target.value)}
              type="tel"
              dir="ltr"
              className="text-left"
            />
          </FormField>

          <FormField label="اینستاگرام">
            <Input
              value={instagramId}
              onChange={(event) => setInstagramId(event.target.value)}
              dir="ltr"
              className="text-left"
            />
          </FormField>
        </div>

        <FormField label="معرفی کسب‌وکار" className="mt-5">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            resize={false}
          />
        </FormField>
      </section>

      <section
        className="
          rounded-[28px]
          bg-white
          p-5
          shadow-sm
          sm:p-7
        "
      >
        <ImageUploader
          placeId={place.id}
          images={place.images}
          maxFiles={8}
          onUploaded={refresh}
          onDelete={handleDeleteImage}
        />
      </section>

      <section
        className="
          rounded-[28px]
          bg-white
          p-5
          shadow-sm
          sm:p-7
        "
      >
        <div className="flex items-center gap-3">
          <FiMapPin />

          <Text variant="heading-md">موقعیت</Text>
        </div>

        <div
          className="
            mt-5
            grid gap-5
            sm:grid-cols-2
          "
        >
          <FormField label="عنوان">
            <Input
              value={locationTitle}
              onChange={(event) => setLocationTitle(event.target.value)}
            />
          </FormField>

          <FormField label="آدرس">
            <Input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </FormField>

          <FormField label="Latitude">
            <Input
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              dir="ltr"
              className="text-left"
            />
          </FormField>

          <FormField label="Longitude">
            <Input
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              dir="ltr"
              className="text-left"
            />
          </FormField>
        </div>
      </section>

      {filters.data && (
        <HostFilterEditor
          filters={filters.data.filters}
          initialSelectedIds={filters.data.selectedIds}
        />
      )}

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {success && <InlineMessage variant="success">{success}</InlineMessage>}

      <Button
        type="button"
        size="xl"
        fullWidth
        startIcon={<FiSave />}
        loading={update.isPending || locationUpsert.isPending}
        onClick={saveDetails}
      >
        ذخیره تغییرات
      </Button>
    </div>
  );
}

function HostFilterEditor({
  filters,
  initialSelectedIds,
}: {
  filters: Array<{
    id: string;
    name: string;

    values: Array<{
      id: string;
      name: string;
    }>;
  }>;

  initialSelectedIds: string[];
}) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);

  const setValues = trpc.host.place.setFilterValues.useMutation();

  const [message, setMessage] = useState<string | null>(null);

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function save() {
    await setValues.mutateAsync({
      filterValueIds: selectedIds,
    });

    setMessage("ویژگی‌ها ذخیره شدند.");
  }

  return (
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

      <div className="mt-6 space-y-6">
        {filters.map((filter) => (
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
                const selected = selectedIds.includes(value.id);

                return (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => toggle(value.id)}
                    className={`
                          rounded-full
                          border
                          px-4
                          py-2
                          text-sm
                          transition-colors

                          ${
                            selected
                              ? "border-(--color-brand-500) bg-(--color-brand-500) text-white"
                              : "border-(--color-border) bg-white"
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

      {message && (
        <InlineMessage variant="success" className="mt-5">
          {message}
        </InlineMessage>
      )}

      <Button
        type="button"
        variant="secondary"
        className="mt-6"
        loading={setValues.isPending}
        onClick={save}
      >
        ذخیره ویژگی‌ها
      </Button>
    </section>
  );
}
