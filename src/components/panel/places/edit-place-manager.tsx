"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  Button,
  FormField,
  ImageUploader,
  InlineMessage,
  Input,
  Text,
  Textarea,
} from "@/components/ui";

import {
  PLACE_TYPE_OPTIONS,
  type PlaceTypeValue,
} from "@/lib/place/place-type";
import { PlaceFiltersEditor } from "./place-filters-editor";
import { trpc } from "@/trpc/client";

type Props = {
  placeId: string;
};

export function EditPlaceManager({ placeId }: Props) {
  const place = trpc.panel.places.getById.useQuery({
    placeId,
  });

  if (place.isPending) {
    return <Text tone="secondary">در حال دریافت اطلاعات مکان...</Text>;
  }

  if (place.error || !place.data) {
    return (
      <InlineMessage variant="error">
        دریافت اطلاعات مکان با خطا مواجه شد.
      </InlineMessage>
    );
  }

  return (
    <EditPlaceForm
      key={place.data.id}
      place={place.data}
      onUpdated={() => place.refetch()}
    />
  );
}

type EditPlaceFormProps = {
  place: {
    id: string;
    placeName: string;
    placePhone: string | null;
    placeType: PlaceTypeValue;
    placeCity: string | null;
    instagramId: string | null;
    description: string | null;
    images: Array<{
      id: string;
      url: string;
      sortOrder: number;
    }>;
    location: {
      id: string;
      title: string | null;
      address: string | null;
      latitude: number;
      longitude: number;
    } | null;

    host: {
      user: {
        id: string;
        fullName: string;
        phoneNumber: string;
      };
    };
  };

  onUpdated: () => void | Promise<unknown>;
};

function EditPlaceForm({ place, onUpdated }: EditPlaceFormProps) {
  const router = useRouter();

  /*
   * =========================
   * BASE PLACE STATE
   * =========================
   */

  const updatePlace = trpc.panel.places.update.useMutation();

  const [placeName, setPlaceName] = useState(place.placeName);

  const [placePhone, setPlacePhone] = useState(place.placePhone ?? "");

  const [placeType, setPlaceType] = useState<PlaceTypeValue>(place.placeType);

  const [placeCity, setPlaceCity] = useState(place.placeCity ?? "");

  const [instagramId, setInstagramId] = useState(place.instagramId ?? "");

  const [description, setDescription] = useState(place.description ?? "");

  const [placeError, setPlaceError] = useState<string | null>(null);

  const [placeSuccess, setPlaceSuccess] = useState<string | null>(null);
  const deleteImage = trpc.panel.places.deleteImage.useMutation();
  /*
   * =========================
   * LOCATION STATE
   * =========================
   */

  const updateLocation = trpc.panel.places.locationUpsert.useMutation();

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

  const [locationError, setLocationError] = useState<string | null>(null);

  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  /*
   * =========================
   * UPDATE BASE PLACE
   * =========================
   */

  async function handlePlaceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPlaceError(null);
    setPlaceSuccess(null);

    try {
      await updatePlace.mutateAsync({
        placeId: place.id,

        placeName,
        placePhone,
        placeType,
        placeCity,
        instagramId,
        description,
      });

      setPlaceSuccess("اطلاعات مکان با موفقیت ذخیره شد.");

      await onUpdated();
    } catch (error) {
      setPlaceError(
        error instanceof Error ? error.message : "ویرایش مکان انجام نشد.",
      );
    }
  }

  /*
   * =========================
   * UPDATE LOCATION
   * =========================
   */

  async function handleLocationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLocationError(null);
    setLocationSuccess(null);

    const parsedLatitude = Number(latitude);

    const parsedLongitude = Number(longitude);

    if (!latitude.trim() || !longitude.trim()) {
      setLocationError("Latitude و Longitude الزامی هستند.");

      return;
    }

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      setLocationError("مختصات جغرافیایی معتبر نیست.");

      return;
    }

    if (parsedLatitude < -90 || parsedLatitude > 90) {
      setLocationError("Latitude باید بین 90- و 90 باشد.");

      return;
    }

    if (parsedLongitude < -180 || parsedLongitude > 180) {
      setLocationError("Longitude باید بین 180- و 180 باشد.");

      return;
    }

    try {
      await updateLocation.mutateAsync({
        placeId: place.id,

        title: locationTitle,

        address,

        latitude: parsedLatitude,

        longitude: parsedLongitude,
      });

      setLocationSuccess("موقعیت مکانی با موفقیت ذخیره شد.");

      await onUpdated();
    } catch (error) {
      console.error("[EditPlaceManager] locationUpsert failed:", error);

      setLocationError(
        error instanceof Error ? error.message : "ذخیره موقعیت انجام نشد.",
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}

      <div
        className="
          flex flex-col gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            ویرایش مکان
          </Text>

          <Text tone="secondary" className="mt-1">
            {place.placeName}
          </Text>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/panel/places")}
        >
          بازگشت
        </Button>
      </div>

      {/* HOST INFO */}

      <section
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-5
        "
      >
        <Text variant="heading-md">اطلاعات میزبان</Text>

        <Text tone="secondary" className="mt-2">
          {place.host.user.fullName}

          {" — "}

          <span dir="ltr" className="inline-block">
            {place.host.user.phoneNumber}
          </span>
        </Text>
      </section>

      {/* ====================== */}
      {/* BASE PLACE FORM */}
      {/* ====================== */}

      <form
        onSubmit={handlePlaceSubmit}
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-5
        "
      >
        <Text variant="heading-md" className="mb-6">
          اطلاعات مکان
        </Text>

        <div
          className="
            grid gap-5
            md:grid-cols-2
          "
        >
          <FormField label="نام مکان" required>
            <Input
              value={placeName}
              onChange={(event) => setPlaceName(event.target.value)}
              disabled={updatePlace.isPending}
            />
          </FormField>

          <FormField label="نوع مکان" required>
            <select
              value={placeType}
              onChange={(event) =>
                setPlaceType(event.target.value as PlaceTypeValue)
              }
              disabled={updatePlace.isPending}
              className="
                h-14 w-full
                rounded-(--radius-full)
                border
                border-(--color-border-strong)
                bg-(--color-surface)
                px-5
                text-[16px]
                outline-none
                transition-colors
                focus:border-(--color-brand-500)
                focus:ring-2
                focus:ring-(--color-brand-100)
                disabled:cursor-not-allowed
                disabled:bg-gray-100
              "
            >
              {PLACE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="شماره مکان">
            <Input
              value={placePhone}
              onChange={(event) => setPlacePhone(event.target.value)}
              type="tel"
              dir="ltr"
              className="text-left"
              disabled={updatePlace.isPending}
            />
          </FormField>

          <FormField label="شهر" required>
            <Input
              value={placeCity}
              onChange={(event) => setPlaceCity(event.target.value)}
              disabled={updatePlace.isPending}
            />
          </FormField>

          <FormField label="اینستاگرام">
            <Input
              value={instagramId}
              onChange={(event) => setInstagramId(event.target.value)}
              dir="ltr"
              className="text-left"
              placeholder="@..."
              disabled={updatePlace.isPending}
            />
          </FormField>
        </div>

        <FormField label="توضیحات" className="mt-5">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            resize={false}
            disabled={updatePlace.isPending}
          />
        </FormField>

        {placeError && (
          <InlineMessage variant="error" className="mt-4">
            {placeError}
          </InlineMessage>
        )}

        {placeSuccess && (
          <InlineMessage variant="success" className="mt-4">
            {placeSuccess}
          </InlineMessage>
        )}

        <div className="mt-6">
          <Button type="submit" loading={updatePlace.isPending}>
            ذخیره تغییرات
          </Button>
        </div>
      </form>

      {/* ====================== */}
      {/* LOCATION FORM */}
      {/* ====================== */}

      <form
        onSubmit={handleLocationSubmit}
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-5
        "
      >
        <div className="mb-6">
          <Text variant="heading-md">موقعیت مکانی</Text>

          <Text variant="body-sm" tone="secondary" className="mt-1">
            آدرس و مختصات جغرافیایی این مکان را مشخص کنید.
          </Text>
        </div>

        <div
          className="
            grid gap-5
            md:grid-cols-2
          "
        >
          <FormField label="عنوان موقعیت">
            <Input
              value={locationTitle}
              onChange={(event) => setLocationTitle(event.target.value)}
              placeholder="مثلاً شعبه ولیعصر"
              disabled={updateLocation.isPending}
            />
          </FormField>

          <FormField label="آدرس">
            <Input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="آدرس کامل"
              disabled={updateLocation.isPending}
            />
          </FormField>

          <FormField label="Latitude" required>
            <Input
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              dir="ltr"
              inputMode="decimal"
              className="text-left"
              placeholder="35.6892"
              disabled={updateLocation.isPending}
            />
          </FormField>

          <FormField label="Longitude" required>
            <Input
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              dir="ltr"
              inputMode="decimal"
              className="text-left"
              placeholder="51.3890"
              disabled={updateLocation.isPending}
            />
          </FormField>
        </div>

        {locationError && (
          <InlineMessage variant="error" className="mt-4">
            {locationError}
          </InlineMessage>
        )}

        {locationSuccess && (
          <InlineMessage variant="success" className="mt-4">
            {locationSuccess}
          </InlineMessage>
        )}

        <div className="mt-6">
          <Button type="submit" loading={updateLocation.isPending}>
            ذخیره موقعیت
          </Button>
        </div>
      </form>
      <section
        className="
    rounded-xl
    border
    border-(--color-border)
    bg-(--color-surface)
    p-5
  "
      >
        <ImageUploader
          placeId={place.id}
          images={place.images}
          onUploaded={() => onUpdated()}
          onDelete={async (imageId) => {
            await deleteImage.mutateAsync({
              imageId,
            });

            await onUpdated();
          }}
        />
      </section>
      <section
        className="
    rounded-xl
    border
    border-(--color-border)
    bg-(--color-surface)
    p-5
  "
      >
        <PlaceFiltersEditor placeId={place.id} />
      </section>
    </div>
  );
}
