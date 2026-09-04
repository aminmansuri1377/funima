"use client";

import Image from "next/image";

import { useMemo, useState } from "react";

import { getCities, getProvincesList } from "@code-plate/iran-cities";

import { FiImage, FiMapPin, FiTrash2, FiUploadCloud } from "react-icons/fi";

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
    <EditPlaceContent
      key={place.data.id}
      place={place.data}
      onUpdated={() => place.refetch()}
    />
  );
}

type EditPlaceContentProps = {
  place: {
    id: string;

    placeName: string;

    placePhone: string | null;

    placeType: PlaceTypeValue;

    placeProvince: string | null;

    placeCity: string | null;

    instagramId: string | null;

    description: string | null;

    host: {
      id: string;

      user: {
        id: string;
        fullName: string;
        phoneNumber: string;
      };
    };

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

  onUpdated: () => void | Promise<unknown>;
};

function EditPlaceContent({ place, onUpdated }: EditPlaceContentProps) {
  const updatePlace = trpc.panel.places.update.useMutation();

  const [placeName, setPlaceName] = useState(place.placeName);

  const [placePhone, setPlacePhone] = useState(place.placePhone ?? "");

  const [placeType, setPlaceType] = useState<PlaceTypeValue>(place.placeType);

  const [instagramId, setInstagramId] = useState(place.instagramId ?? "");

  const [description, setDescription] = useState(place.description ?? "");

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const provinces = useMemo(() => getProvincesList(), []);

  const initialProvince = useMemo(
    () => provinces.find((item) => item.fa === place.placeProvince),
    [provinces, place.placeProvince],
  );

  const [province, setProvince] = useState(initialProvince?.en ?? "");

  const cities = useMemo(() => {
    if (!province) {
      return [];
    }

    return getCities(province);
  }, [province]);

  const initialCity = useMemo(
    () => cities.find((item) => item.fa === place.placeCity),
    [cities, place.placeCity],
  );

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

  function handleProvinceChange(nextProvince: string) {
    setProvince(nextProvince);

    setCity("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!placeName.trim()) {
      setError("نام مکان الزامی است.");

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
      await updatePlace.mutateAsync({
        placeId: place.id,

        placeName: placeName.trim(),

        placePhone: placePhone.trim(),

        placeType,

        placeProvince: selectedProvince.fa,

        placeCity: selectedCity.fa,

        instagramId: instagramId.trim(),

        description: description.trim(),
      });

      setSuccess("اطلاعات مکان با موفقیت ذخیره شد.");

      await onUpdated();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ویرایش مکان انجام نشد.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="heading-xl">
          ویرایش مکان
        </Text>

        <Text tone="secondary" className="mt-1">
          {place.placeName}
        </Text>
      </div>

      <section
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-5
        "
      >
        <div className="mb-6">
          <Text variant="heading-md">اطلاعات اصلی</Text>

          <Text tone="secondary" className="mt-1">
            اطلاعات پایه مکان و میزبان
          </Text>
        </div>

        <div
          className="
            mb-6
            rounded-xl
            bg-gray-50
            p-4
          "
        >
          <Text variant="label-md">میزبان</Text>

          <Text className="mt-1">{place.host.user.fullName}</Text>

          <Text tone="secondary" variant="caption" dir="ltr" className="mt-1">
            {place.host.user.phoneNumber}
          </Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="نام مکان"
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
                  text-(--color-text-primary)
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

            <FormField label="استان" required>
              <SearchSelect
                value={province}
                options={provinceOptions}
                onChange={handleProvinceChange}
                placeholder="انتخاب استان"
                searchPlaceholder="جستجوی استان..."
                emptyMessage="استانی پیدا نشد."
                disabled={updatePlace.isPending}
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
                disabled={!province || updatePlace.isPending}
              />
            </FormField>

            <FormField label="شماره مکان">
              <Input
                value={placePhone}
                onChange={(event) => setPlacePhone(event.target.value)}
                type="tel"
                dir="ltr"
                className="text-left"
                placeholder="021..."
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

          <FormField label="توضیحات">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              resize={false}
              placeholder="توضیحات مکان..."
              disabled={updatePlace.isPending}
            />
          </FormField>

          {error && <InlineMessage variant="error">{error}</InlineMessage>}

          {success && (
            <InlineMessage variant="success">{success}</InlineMessage>
          )}

          <Button type="submit" loading={updatePlace.isPending}>
            ذخیره تغییرات
          </Button>
        </form>
      </section>

      <LocationEditor
        placeId={place.id}
        location={place.location}
        onChanged={onUpdated}
      />

      <PlaceGalleryEditor
        placeId={place.id}
        images={place.images}
        onChanged={onUpdated}
      />

      <PlaceFiltersEditor placeId={place.id} />
    </div>
  );
}

type LocationEditorProps = {
  placeId: string;

  location: {
    id: string;

    title: string | null;

    address: string | null;

    latitude: number;

    longitude: number;
  } | null;

  onChanged: () => void | Promise<unknown>;
};

function LocationEditor({ placeId, location, onChanged }: LocationEditorProps) {
  const [title, setTitle] = useState(location?.title ?? "");

  const [address, setAddress] = useState(location?.address ?? "");

  const [position, setPosition] = useState<LngLat | null>(
    location ? [location.longitude, location.latitude] : null,
  );

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const locationUpsert = trpc.panel.places.locationUpsert.useMutation();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!position) {
      setError("لطفاً موقعیت دقیق مکان را روی نقشه انتخاب کنید.");

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
      await locationUpsert.mutateAsync({
        placeId,

        title: title.trim(),

        address: address.trim(),

        latitude,

        longitude,
      });

      setSuccess("موقعیت مکان با موفقیت ذخیره شد.");

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ذخیره موقعیت انجام نشد.",
      );
    }
  }

  return (
    <section
      className="
        rounded-xl
        border
        border-(--color-border)
        bg-(--color-surface)
        p-5
      "
    >
      <div className="mb-6">
        <Text variant="heading-md">موقعیت مکان</Text>

        <Text tone="secondary" className="mt-1">
          آدرس را وارد کنید و موقعیت دقیق را روی نقشه مشخص کنید.
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          className="
            grid gap-5
            md:grid-cols-2
          "
        >
          <FormField label="عنوان موقعیت">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثلاً شعبه اصلی"
              disabled={locationUpsert.isPending}
            />
          </FormField>

          <FormField label="آدرس">
            <Input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="آدرس کامل"
              disabled={locationUpsert.isPending}
            />
          </FormField>
        </div>

        <LocationPicker
          value={position}
          onChange={setPosition}
          disabled={locationUpsert.isPending}
          title="ویرایش موقعیت دقیق"
          description="مکان را جستجو کنید، از موقعیت فعلی استفاده کنید یا نشانگر را روی نقشه جابه‌جا کنید."
          mapHeightClassName="
            h-[260px]
            sm:h-[360px]
            lg:h-[420px]
          "
        />

        {error && <InlineMessage variant="error">{error}</InlineMessage>}

        {success && <InlineMessage variant="success">{success}</InlineMessage>}

        <Button
          type="submit"
          startIcon={<FiMapPin />}
          loading={locationUpsert.isPending}
        >
          ذخیره موقعیت
        </Button>
      </form>
    </section>
  );
}

type PlaceGalleryEditorProps = {
  placeId: string;

  images: Array<{
    id: string;
    url: string;
    sortOrder: number;
  }>;

  onChanged: () => void | Promise<unknown>;
};

function PlaceGalleryEditor({
  placeId,
  images,
  onChanged,
}: PlaceGalleryEditorProps) {
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const deleteImage = trpc.panel.places.deleteImage.useMutation();

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();

        formData.append("file", file);

        formData.append("placeId", placeId);

        const response = await fetch("/api/uploads/place", {
          method: "POST",

          body: formData,
        });

        const responseText = await response.text();

        let result: {
          success?: boolean;
          error?: string;
        };

        try {
          result = JSON.parse(responseText);
        } catch {
          throw new Error(`خطای سرور هنگام آپلود تصویر (${response.status}).`);
        }

        if (!response.ok) {
          throw new Error(result.error ?? "آپلود تصویر انجام نشد.");
        }
      }

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "آپلود تصویر انجام نشد.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    const confirmed = window.confirm("این تصویر حذف شود؟");

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteImage.mutateAsync({
        imageId,
      });

      await onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف تصویر انجام نشد.");
    }
  }

  return (
    <section
      className="
        rounded-xl
        border
        border-(--color-border)
        bg-(--color-surface)
        p-5
      "
    >
      <div
        className="
          mb-6
          flex flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <Text variant="heading-md">تصاویر مکان</Text>

          <Text tone="secondary" className="mt-1">
            گالری تصاویر این مکان
          </Text>
        </div>

        <label
          className="
            inline-flex
            cursor-pointer
            items-center
            gap-2
            rounded-full
            bg-(--color-brand-500)
            px-5
            py-3
            text-sm
            font-semibold
            text-white
          "
        >
          <FiUploadCloud />

          {uploading ? "در حال آپلود..." : "آپلود تصویر"}

          <input
            type="file"
            multiple
            hidden
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            onChange={(event) => {
              void handleUpload(event.target.files);

              event.target.value = "";
            }}
          />
        </label>
      </div>

      {error && (
        <InlineMessage variant="error" className="mb-4">
          {error}
        </InlineMessage>
      )}

      {images.length === 0 ? (
        <div
          className="
            flex min-h-40
            flex-col
            items-center
            justify-center
            rounded-xl
            border
            border-dashed
            border-(--color-border)
            bg-gray-50
            text-center
          "
        >
          <FiImage size={28} className="mb-2" />

          <Text variant="label-md">هنوز تصویری آپلود نشده</Text>
        </div>
      ) : (
        <div
          className="
            grid gap-4
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {images.map((image) => (
            <div
              key={image.id}
              className="
                  overflow-hidden
                  rounded-xl
                  border
                  border-(--color-border)
                "
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={image.url}
                  alt="تصویر مکان"
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>

              <div className="p-3">
                <Button
                  type="button"
                  size="sm"
                  variant="tertiary"
                  startIcon={<FiTrash2 />}
                  disabled={deleteImage.isPending}
                  onClick={() => handleDelete(image.id)}
                >
                  حذف تصویر
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PlaceFiltersEditor({ placeId }: { placeId: string }) {
  const options = trpc.panel.filters.placeOptions.useQuery({
    placeId,
  });

  if (options.isPending) {
    return (
      <section
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-5
        "
      >
        <Text tone="secondary">در حال دریافت فیلترها...</Text>
      </section>
    );
  }

  if (options.error || !options.data) {
    return (
      <InlineMessage variant="error">
        دریافت فیلترهای مکان انجام نشد.
      </InlineMessage>
    );
  }

  return (
    <PlaceFiltersEditorContent
      key={options.data.selectedIds.slice().sort().join("-")}
      placeId={placeId}
      filters={options.data.filters}
      initialSelectedIds={options.data.selectedIds}
      onUpdated={() => options.refetch()}
    />
  );
}

type PlaceFiltersEditorContentProps = {
  placeId: string;

  filters: Array<{
    id: string;
    name: string;

    values: Array<{
      id: string;
      name: string;
    }>;
  }>;

  initialSelectedIds: string[];

  onUpdated: () => void | Promise<unknown>;
};

function PlaceFiltersEditorContent({
  placeId,
  filters,
  initialSelectedIds,
  onUpdated,
}: PlaceFiltersEditorContentProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const update = trpc.panel.filters.setPlaceValues.useMutation();

  function toggle(filterValueId: string) {
    setSuccess(null);

    setSelectedIds((current) =>
      current.includes(filterValueId)
        ? current.filter((id) => id !== filterValueId)
        : [...current, filterValueId],
    );
  }

  async function save() {
    setError(null);
    setSuccess(null);

    try {
      await update.mutateAsync({
        placeId,

        filterValueIds: selectedIds,
      });

      setSuccess("ویژگی‌های مکان با موفقیت ذخیره شدند.");

      await onUpdated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "ذخیره ویژگی‌های مکان انجام نشد.",
      );
    }
  }

  return (
    <section
      className="
        rounded-xl
        border
        border-(--color-border)
        bg-(--color-surface)
        p-5
      "
    >
      <div className="mb-6">
        <Text variant="heading-md">ویژگی‌ها و فیلترهای مکان</Text>

        <Text tone="secondary" className="mt-1">
          گزینه‌هایی را که برای این مکان صدق می‌کنند انتخاب کنید.
        </Text>
      </div>

      {filters.length === 0 ? (
        <div
          className="
            rounded-xl
            border
            border-dashed
            border-(--color-border)
            p-8
            text-center
          "
        >
          <Text variant="label-lg">فیلتری وجود ندارد</Text>

          <Text tone="secondary" className="mt-2">
            ابتدا از بخش فیلترهای پنل، گروه و گزینه ایجاد کنید.
          </Text>
        </div>
      ) : (
        <div className="space-y-7">
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
                      aria-pressed={selected}
                      onClick={() => toggle(value.id)}
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

      {error && (
        <InlineMessage variant="error" className="mt-5">
          {error}
        </InlineMessage>
      )}

      {success && (
        <InlineMessage variant="success" className="mt-5">
          {success}
        </InlineMessage>
      )}

      {filters.length > 0 && (
        <div className="mt-6">
          <Button type="button" loading={update.isPending} onClick={save}>
            ذخیره ویژگی‌ها
          </Button>
        </div>
      )}
    </section>
  );
}
