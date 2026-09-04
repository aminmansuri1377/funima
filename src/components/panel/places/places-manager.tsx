"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FiEdit2, FiMapPin, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  Button,
  FormField,
  InlineMessage,
  Input,
  Pagination,
  SearchInput,
  Text,
  Textarea,
} from "@/components/ui";

import {
  PLACE_TYPE_OPTIONS,
  type PlaceTypeValue,
} from "@/lib/place/place-type";

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
            مدیریت مکان‌های فونیما
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
          border border-(--color-border)
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
          placeholder="جستجو با نام مکان، شهر یا میزبان..."
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

  const [hostId, setHostId] = useState("");

  const [placeName, setPlaceName] = useState("");

  const [placePhone, setPlacePhone] = useState("");

  const [placeType, setPlaceType] = useState<PlaceTypeValue>("CAFE");

  const [placeCity, setPlaceCity] = useState("");

  const [instagramId, setInstagramId] = useState("");

  const [description, setDescription] = useState("");

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!hostId) {
      setError("لطفاً میزبان را انتخاب کنید.");

      return;
    }

    try {
      await createPlace.mutateAsync({
        hostId,
        placeName,
        placePhone,
        placeType,
        placeCity,
        instagramId,
        description,
      });

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
        border border-(--color-border)
        bg-(--color-surface)
        p-5
      "
    >
      <Text variant="heading-md" className="mb-6">
        افزودن مکان جدید
      </Text>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="میزبان" required>
          <select
            value={hostId}
            onChange={(event) => setHostId(event.target.value)}
            disabled={hosts.isPending || createPlace.isPending}
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
            placeholder="نام کافه"
            disabled={createPlace.isPending}
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
            disabled={createPlace.isPending}
          />
        </FormField>

        <FormField label="نوع مکان" required>
          <select
            value={placeType}
            onChange={(event) =>
              setPlaceType(event.target.value as PlaceTypeValue)
            }
            disabled={createPlace.isPending}
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

        <FormField label="شهر" required>
          <Input
            value={placeCity}
            onChange={(event) => setPlaceCity(event.target.value)}
            placeholder="تهران"
            disabled={createPlace.isPending}
          />
        </FormField>

        <FormField label="اینستاگرام">
          <Input
            value={instagramId}
            onChange={(event) => setInstagramId(event.target.value)}
            dir="ltr"
            className="text-left"
            placeholder="@..."
            disabled={createPlace.isPending}
          />
        </FormField>
      </div>

      <FormField label="توضیحات" className="mt-5">
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="توضیحات مکان..."
          resize={false}
          disabled={createPlace.isPending}
        />
      </FormField>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}

      <div className="mt-6">
        <Button
          type="submit"
          loading={createPlace.isPending}
          startIcon={<FiMapPin />}
        >
          ایجاد مکان
        </Button>
      </div>
    </form>
  );
}

type PlaceListItem = {
  id: string;
  placeName: string;
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
          border border-dashed
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
          border border-(--color-border)
          bg-white
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="bg-gray-50 text-right">
              <tr>
                <th className="px-5 py-4">مکان</th>

                <th className="px-5 py-4">میزبان</th>

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
