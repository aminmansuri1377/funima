"use client";

import { useMemo, useState } from "react";

import { getCities, getProvincesList } from "@code-plate/iran-cities";

import { FiArrowLeft, FiMapPin } from "react-icons/fi";

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

import { trpc } from "@/trpc/client";

type Props = {
  onCreated: () => void | Promise<unknown>;
};

export function HostPlaceStepOne({ onCreated }: Props) {
  const createPlace = trpc.host.place.create.useMutation();

  const [placeName, setPlaceName] = useState("");

  const [placeType, setPlaceType] = useState<PlaceTypeValue>("CAFE");

  const [province, setProvince] = useState("");

  const [city, setCity] = useState("");

  const [placePhone, setPlacePhone] = useState("");

  const [instagramId, setInstagramId] = useState("");

  const [description, setDescription] = useState("");

  const [error, setError] = useState<string | null>(null);

  const provinces = useMemo(() => getProvincesList(), []);

  const cities = useMemo(() => {
    if (!province) {
      return [];
    }

    return getCities(province);
  }, [province]);

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

  function handleProvinceChange(nextProvince: string) {
    setProvince(nextProvince);

    setCity("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (placeName.trim().length < 2) {
      setError("نام کسب‌وکار را وارد کنید.");

      return;
    }

    if (!selectedProvince) {
      setError("لطفاً استان را انتخاب کنید.");

      return;
    }

    if (!selectedCity) {
      setError("لطفاً شهر را انتخاب کنید.");

      return;
    }

    try {
      await createPlace.mutateAsync({
        placeName: placeName.trim(),

        placeType,

        placeProvince: selectedProvince.fa,

        placeCity: selectedCity.fa,

        placePhone: placePhone.trim(),

        instagramId: instagramId.trim(),

        description: description.trim(),
      });

      await onCreated();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ثبت کسب‌وکار انجام نشد.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Text as="h1" variant="heading-xl">
          ثبت کسب‌وکار
        </Text>

        <Text tone="secondary" className="mt-2">
          اطلاعات اولیه کسب‌وکار خود را وارد کنید
        </Text>
      </div>

      <div
        className="
          mx-auto
          flex
          max-w-xl
          items-center
          justify-center
          gap-3
        "
      >
        <StepBadge active number="۱" label="اطلاعات پایه" />

        <div
          className="
            h-px
            w-10
            bg-(--color-border)
          "
        />

        <StepBadge number="۲" label="تکمیل پروفایل" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="
          mx-auto
          max-w-2xl
          space-y-6
          rounded-3xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-5
          shadow-sm
          sm:p-7
        "
      >
        <div>
          <Text variant="heading-md">اطلاعات کسب‌وکار</Text>

          <Text tone="secondary" className="mt-1">
            اطلاعات اصلی مکان شما
          </Text>
        </div>

        <FormField label="نام کسب‌وکار" required>
          <Input
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            placeholder="مثلاً کافه روم"
            disabled={createPlace.isPending}
          />
        </FormField>

        <FormField label="نوع کسب‌وکار" required>
          <SearchSelect
            value={placeType}
            options={PLACE_TYPE_OPTIONS}
            onChange={(value) => setPlaceType(value as PlaceTypeValue)}
            placeholder="انتخاب نوع کسب‌وکار"
            searchPlaceholder="جستجوی نوع مکان..."
            disabled={createPlace.isPending}
          />
        </FormField>

        <div
          className="
            grid gap-5
            sm:grid-cols-2
          "
        >
          <FormField label="استان" required>
            <SearchSelect
              value={province}
              options={provinceOptions}
              onChange={handleProvinceChange}
              placeholder="انتخاب استان"
              searchPlaceholder="جستجوی استان..."
              emptyMessage="استانی پیدا نشد."
              disabled={createPlace.isPending}
            />
          </FormField>

          <FormField label="شهر" required>
            <SearchSelect
              value={city}
              options={cityOptions}
              onChange={setCity}
              placeholder={
                province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"
              }
              searchPlaceholder="جستجوی شهر..."
              emptyMessage="شهری پیدا نشد."
              disabled={!province || createPlace.isPending}
            />
          </FormField>
        </div>

        <div
          className="
            grid gap-5
            sm:grid-cols-2
          "
        >
          <FormField label="شماره تماس">
            <Input
              value={placePhone}
              onChange={(event) => setPlacePhone(event.target.value)}
              type="tel"
              dir="ltr"
              className="text-left"
              placeholder="021..."
              disabled={createPlace.isPending}
            />
          </FormField>

          <FormField label="اینستاگرام">
            <Input
              value={instagramId}
              onChange={(event) => setInstagramId(event.target.value)}
              dir="ltr"
              className="text-left"
              placeholder="@username"
              disabled={createPlace.isPending}
            />
          </FormField>
        </div>

        <FormField label="معرفی کوتاه">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="کسب‌وکار خود را کوتاه معرفی کنید..."
            resize={false}
            disabled={createPlace.isPending}
          />
        </FormField>

        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-(--color-border)
            bg-gray-50
            p-5
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                flex h-10 w-10
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
              <Text variant="label-lg">موقعیت دقیق</Text>

              <Text tone="secondary" className="mt-1">
                موقعیت روی نقشه را در مرحله بعد ثبت می‌کنیم.
              </Text>
            </div>
          </div>
        </div>

        {error && <InlineMessage variant="error">{error}</InlineMessage>}

        <Button
          type="submit"
          size="xl"
          fullWidth
          loading={createPlace.isPending}
          endIcon={<FiArrowLeft />}
        >
          ادامه
        </Button>
      </form>
    </div>
  );
}

function StepBadge({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          flex h-9 w-9
          items-center
          justify-center
          rounded-full
          text-sm
          font-bold

          ${
            active
              ? "bg-(--color-brand-500) text-white"
              : "bg-gray-100 text-(--color-text-secondary)"
          }
        `}
      >
        {number}
      </div>

      <Text variant="caption" tone={active ? "primary" : "secondary"}>
        {label}
      </Text>
    </div>
  );
}
