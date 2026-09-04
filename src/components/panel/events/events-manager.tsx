"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FiCalendar, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  Button,
  InlineMessage,
  Pagination,
  SearchInput,
  Text,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

export function EventsManager() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(20);

  const [error, setError] = useState<string | null>(null);

  const events = trpc.panel.events.list.useQuery({
    page,
    pageSize,

    search: debouncedSearch.trim() || undefined,
  });

  const deleteEvent = trpc.panel.events.delete.useMutation();

  function clearSearch() {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }

  async function handleDelete(eventId: string, eventName: string) {
    const confirmed = window.confirm(`رویداد «${eventName}» حذف شود؟`);

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteEvent.mutateAsync({
        eventId,
      });

      await events.refetch();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "حذف رویداد انجام نشد.",
      );
    }
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
            رویدادها
          </Text>

          <Text tone="secondary" className="mt-1">
            مدیریت رویدادهای فونیما
          </Text>
        </div>

        <Button
          startIcon={<FiPlus />}
          onClick={() => router.push("/panel/events/new")}
        >
          افزودن رویداد
        </Button>
      </div>

      <section
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
          onClear={clearSearch}
          placeholder="جستجوی نام رویداد، مکان یا شهر..."
        />
      </section>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {events.isPending && (
        <Text tone="secondary">در حال دریافت رویدادها...</Text>
      )}

      {events.error && (
        <InlineMessage variant="error">
          دریافت رویدادها با خطا مواجه شد.
        </InlineMessage>
      )}

      {events.data && (
        <>
          <EventsTable
            events={events.data.items}
            deleting={deleteEvent.isPending}
            onEdit={(eventId) => router.push(`/panel/events/${eventId}`)}
            onDelete={handleDelete}
          />

          {events.data.pagination.total > 0 && (
            <Pagination
              page={events.data.pagination.page}
              pageSize={events.data.pagination.pageSize}
              totalItems={events.data.pagination.total}
              totalPages={events.data.pagination.totalPages}
              disabled={events.isFetching}
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

type EventListItem = {
  id: string;
  eventName: string;

  date: Date | string;

  hour: string | null;

  price: string | null;

  place: {
    id: string;
    placeName: string;
    placeCity: string | null;

    images: Array<{
      url: string;
    }>;
  };

  _count: {
    plans: number;
    comments: number;
    savedBy: number;
  };
};

type EventsTableProps = {
  events: EventListItem[];

  deleting: boolean;

  onEdit: (eventId: string) => void;

  onDelete: (eventId: string, eventName: string) => void;
};

function EventsTable({ events, deleting, onEdit, onDelete }: EventsTableProps) {
  if (events.length === 0) {
    return (
      <div
        className="
          rounded-xl
          border border-dashed
          border-(--color-border)
          bg-(--color-surface)
          p-12
          text-center
        "
      >
        <FiCalendar size={32} className="mx-auto mb-3" />

        <Text variant="heading-md">رویدادی پیدا نشد</Text>

        <Text tone="secondary" className="mt-2">
          هنوز رویدادی ثبت نشده یا نتیجه‌ای برای جستجو وجود ندارد.
        </Text>
      </div>
    );
  }

  return (
    <div
      className="
        overflow-hidden
        rounded-xl
        border
        border-(--color-border)
        bg-(--color-surface)
      "
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead className="bg-gray-50 text-right">
            <tr>
              <th className="px-5 py-4">رویداد</th>

              <th className="px-5 py-4">مکان</th>

              <th className="px-5 py-4">تاریخ</th>

              <th className="px-5 py-4">ساعت</th>

              <th className="px-5 py-4">قیمت</th>

              <th className="px-5 py-4">برنامه‌ها</th>

              <th className="px-5 py-4">ذخیره‌ها</th>

              <th className="px-5 py-4">عملیات</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                className="
                    border-t
                    border-(--color-border)
                  "
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <EventThumbnail
                      image={event.place.images[0]?.url ?? null}
                      name={event.eventName}
                    />

                    <Text variant="label-md">{event.eventName}</Text>
                  </div>
                </td>

                <td className="px-5 py-4">
                  {event.place.placeName}

                  {event.place.placeCity && (
                    <Text variant="caption" tone="secondary" className="mt-1">
                      {event.place.placeCity}
                    </Text>
                  )}
                </td>

                <td className="px-5 py-4">{formatDate(event.date)}</td>

                <td dir="ltr" className="px-5 py-4 text-right">
                  {event.hour ?? "—"}
                </td>

                <td className="px-5 py-4">
                  {event.price ? `${event.price} تومان` : "رایگان / ثبت نشده"}
                </td>

                <td className="px-5 py-4">{event._count.plans}</td>

                <td className="px-5 py-4">{event._count.savedBy}</td>

                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      startIcon={<FiEdit2 />}
                      onClick={() => onEdit(event.id)}
                    >
                      ویرایش
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      startIcon={<FiTrash2 />}
                      disabled={deleting}
                      onClick={() => onDelete(event.id, event.eventName)}
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
  );
}

function EventThumbnail({
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
        "
      >
        <FiCalendar />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
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

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
