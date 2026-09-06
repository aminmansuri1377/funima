"use client";

import Image from "next/image";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { getCities, getProvincesList } from "@code-plate/iran-cities";

import { FiEdit2, FiMapPin, FiPlus, FiTrash2 } from "react-icons/fi";

import { LocationPicker } from "@/components/map";

import {
  Button,
  FormField,
  InlineMessage,
  Input,
  Pagination,
  SearchInput,
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

export function PlacesManager() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(20);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const places = trpc.panel.places.list.useQuery({
    page,
    pageSize,

    search: debouncedSearch.trim() || undefined,
  });

  function handleClearSearch() {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
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
            مکان‌ها
          </Text>

          <Text tone="secondary" className="mt-1">
            مدیریت مکان‌های فانیما
          </Text>
        </div>

        <Button
          startIcon={<FiPlus />}
          onClick={() => setShowCreateForm((value) => !value)}
        >
          افزودن مکان
        </Button>
      </div>

      {showCreateForm && (
        <CreatePlaceForm
          onCreated={() => {
            setShowCreateForm(false);

            setPage(1);

            void places.refetch();
          }}
        />
      )}

      <div
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-4
        "
      >
        <SearchInput
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);

            setPage(1);
          }}
          onDebouncedChange={(value) => {
            setDebouncedSearch(value);

            setPage(1);
          }}
          onClear={handleClearSearch}
          placeholder="جستجو با نام مکان، استان، شهر یا میزبان..."
        />
      </div>

      {places.isPending && (
        <Text tone="secondary">در حال دریافت مکان‌ها...</Text>
      )}

      {places.error && (
        <InlineMessage variant="error">
          دریافت مکان‌ها با خطا مواجه شد.
        </InlineMessage>
      )}

      {places.data && (
        <>
          <PlacesTable
            places={places.data.items}
            onChanged={() => places.refetch()}
            onEdit={(placeId) => router.push(`/panel/places/${placeId}`)}
          />

          {places.data.pagination.total > 0 && (
            <Pagination
              page={places.data.pagination.page}
              pageSize={places.data.pagination.pageSize}
              totalItems={places.data.pagination.total}
              totalPages={places.data.pagination.totalPages}
              disabled={places.isFetching}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);

                setPage(1);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function CreatePlaceForm({ onCreated }: { onCreated: () => void }) {
  const hosts = trpc.panel.places.availableHosts.useQuery();

  const createPlace = trpc.panel.places.create.useMutation();

  const locationUpsert = trpc.panel.places.locationUpsert.useMutation();

  const [hostId, setHostId] = useState("");

  const [placeName, setPlaceName] = useState("");

  const [placePhone, setPlacePhone] = useState("");

  const [placeType, setPlaceType] = useState<PlaceTypeValue>("CAFE");

  /*
   * داخل UI مقدار انگلیسی استان/شهر
   * را نگه می‌داریم.
   *
   * ولی نام فارسی در DB ذخیره می‌شود.
   */
  const [province, setProvince] = useState("");

  const [city, setCity] = useState("");

  const [instagramId, setInstagramId] = useState("");

  const [description, setDescription] = useState("");

  const [locationTitle, setLocationTitle] = useState("");

  const [locationAddress, setLocationAddress] = useState("");

  const [position, setPosition] = useState<LngLat | null>(null);

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
      provinces.map((provinceItem) => ({
        value: provinceItem.en,

        label: provinceItem.fa,
      })),
    [provinces],
  );

  const cityOptions = useMemo(
    () =>
      cities.map((cityItem) => ({
        value: cityItem.en,

        label: cityItem.fa,
      })),
    [cities],
  );

  const selectedProvince = provinces.find(
    (provinceItem) => provinceItem.en === province,
  );

  const selectedCity = cities.find((cityItem) => cityItem.en === city);

  const submitting = createPlace.isPending || locationUpsert.isPending;

  function handleProvinceChange(nextProvince: string) {
    setProvince(nextProvince);

    setCity("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!hostId) {
      setError("لطفاً میزبان را انتخاب کنید.");

      return;
    }

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
      const created = await createPlace.mutateAsync({
        hostId,

        placeName: placeName.trim(),

        placePhone: placePhone.trim(),

        placeType,

        placeProvince: selectedProvince.fa,

        placeCity: selectedCity.fa,

        instagramId: instagramId.trim(),

        description: description.trim(),
      });

      try {
        await locationUpsert.mutateAsync({
          placeId: created.placeId,

          title: locationTitle.trim(),

          address: locationAddress.trim(),

          latitude,

          longitude,
        });
      } catch (locationError) {
        /*
         * Place ساخته شده است، پس دوباره create نمی‌کنیم.
         * لیست را refresh می‌کنیم تا Admin بتواند Location
         * را از صفحه ویرایش همان Place تکمیل کند.
         */
        console.error(
          "[PlacesManager] Place created but location save failed:",
          locationError,
        );

        onCreated();

        return;
      }

      onCreated();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ایجاد مکان انجام نشد.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        rounded-xl
        border
        border-(--color-border)
        bg-(--color-surface)
        p-5
      "
    >
      <Text variant="heading-md" className="mb-6">
        افزودن مکان جدید
      </Text>

      <div
        className="
          grid gap-5
          md:grid-cols-2
        "
      >
        <FormField label="میزبان" required>
          <select
            value={hostId}
            onChange={(event) => setHostId(event.target.value)}
            disabled={hosts.isPending || submitting}
            className="
              h-14 w-full
              rounded-(--radius-full)
              border
              border-(--color-border-strong)
              bg-white
              px-5
              outline-none

              focus:border-(--color-brand-500)
            "
          >
            <option value="">انتخاب میزبان</option>

            {hosts.data?.map((host) => (
              <option key={host.id} value={host.id}>
                {host.user.fullName}
                {" - "}
                {host.user.phoneNumber}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="نام مکان" required>
          <Input
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            placeholder="نام کافه یا مجموعه"
            disabled={submitting}
          />
        </FormField>

        <FormField label="نوع مکان" required>
          <select
            value={placeType}
            onChange={(event) =>
              setPlaceType(event.target.value as PlaceTypeValue)
            }
            disabled={submitting}
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
            disabled={submitting}
          />
        </FormField>

        <FormField label="شهر" required>
          <SearchSelect
            value={city}
            options={cityOptions}
            onChange={setCity}
            placeholder={province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}
            searchPlaceholder="جستجوی شهر..."
            emptyMessage="شهری پیدا نشد."
            disabled={!province || submitting}
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
            disabled={submitting}
          />
        </FormField>

        <FormField label="اینستاگرام">
          <Input
            value={instagramId}
            onChange={(event) => setInstagramId(event.target.value)}
            dir="ltr"
            className="text-left"
            placeholder="@..."
            disabled={submitting}
          />
        </FormField>
      </div>

      <FormField label="توضیحات" className="mt-5">
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="توضیحات مکان..."
          resize={false}
          disabled={submitting}
        />
      </FormField>

      <div
        className="
          mt-6
          rounded-xl
          border
          border-(--color-border)
          p-4
          sm:p-5
        "
      >
        <div className="mb-5">
          <Text variant="heading-md">موقعیت مکان</Text>

          <Text tone="secondary" className="mt-1">
            آدرس و موقعیت دقیق مکان را مشخص کنید.
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
              placeholder="مثلاً شعبه اصلی"
              disabled={submitting}
            />
          </FormField>

          <FormField label="آدرس">
            <Input
              value={locationAddress}
              onChange={(event) => setLocationAddress(event.target.value)}
              placeholder="آدرس کامل"
              disabled={submitting}
            />
          </FormField>
        </div>

        <div className="mt-5">
          <LocationPicker
            value={position}
            onChange={setPosition}
            disabled={submitting}
            title="انتخاب موقعیت دقیق"
            description="مکان را جستجو کنید، از موقعیت فعلی استفاده کنید یا نشانگر را روی نقشه جابه‌جا کنید."
            mapHeightClassName="
              h-[260px]
              sm:h-[360px]
              lg:h-[420px]
            "
          />
        </div>
      </div>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}

      <div className="mt-6">
        <Button type="submit" loading={submitting} startIcon={<FiMapPin />}>
          ایجاد مکان
        </Button>
      </div>
    </form>
  );
}

type PlaceListItem = {
  id: string;

  placeName: string;

  placeProvince: string | null;

  placeCity: string | null;

  host: {
    user: {
      fullName: string;
    };
  };

  images: Array<{
    url: string;
  }>;

  _count: {
    events: number;
    comments: number;
  };
};

type PlacesTableProps = {
  places: PlaceListItem[];

  onChanged: () => void | Promise<unknown>;

  onEdit: (placeId: string) => void;
};

function PlacesTable({ places, onChanged, onEdit }: PlacesTableProps) {
  const [error, setError] = useState<string | null>(null);

  const deletePlace = trpc.panel.places.delete.useMutation();

  async function handleDelete(placeId: string, placeName: string) {
    const confirmed = window.confirm(
      `آیا از حذف مکان «${placeName}» مطمئن هستید؟`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deletePlace.mutateAsync({
        placeId,
      });

      await onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف مکان انجام نشد.");
    }
  }

  if (places.length === 0) {
    return (
      <div
        className="
          rounded-xl
          border
          border-dashed
          border-(--color-border)
          bg-white
          p-10
          text-center
        "
      >
        <Text variant="heading-md">مکانی پیدا نشد</Text>

        <Text tone="secondary" className="mt-2">
          هنوز مکانی ثبت نشده یا نتیجه‌ای برای جستجو وجود ندارد.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-(--color-border)
          bg-white
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-gray-50 text-right">
              <tr>
                <th className="px-5 py-4">مکان</th>

                <th className="px-5 py-4">میزبان</th>

                <th className="px-5 py-4">استان</th>

                <th className="px-5 py-4">شهر</th>

                <th className="px-5 py-4">رویداد</th>

                <th className="px-5 py-4">کامنت</th>

                <th className="px-5 py-4">عملیات</th>
              </tr>
            </thead>

            <tbody>
              {places.map((place) => (
                <tr
                  key={place.id}
                  className="
                      border-t
                      border-(--color-border)
                    "
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <PlaceThumbnail
                        image={place.images?.[0]?.url ?? null}
                        name={place.placeName}
                      />

                      <Text variant="label-md">{place.placeName}</Text>
                    </div>
                  </td>

                  <td className="px-5 py-4">{place.host.user.fullName}</td>

                  <td className="px-5 py-4">{place.placeProvince ?? "—"}</td>

                  <td className="px-5 py-4">{place.placeCity ?? "—"}</td>

                  <td className="px-5 py-4">{place._count.events}</td>

                  <td className="px-5 py-4">{place._count.comments}</td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        startIcon={<FiEdit2 />}
                        onClick={() => onEdit(place.id)}
                      >
                        ویرایش
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="tertiary"
                        startIcon={<FiTrash2 />}
                        disabled={deletePlace.isPending}
                        onClick={() => handleDelete(place.id, place.placeName)}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlaceThumbnail({
  image,
  name,
}: {
  image: string | null;

  name: string;
}) {
  if (!image) {
    return (
      <div
        className="
          flex h-12 w-12
          shrink-0
          items-center
          justify-center
          rounded-md
          bg-(--color-brand-50)
          text-(--color-brand-500)
        "
      >
        <FiMapPin />
      </div>
    );
  }

  return (
    <div
      className="
        relative h-12 w-12
        shrink-0
        overflow-hidden
        rounded-md
      "
    >
      <Image
        src={image}
        alt={name}
        fill
        sizes="48px"
        className="object-cover"
      />
    </div>
  );
}
