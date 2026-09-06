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

type EventListItem = {
  id: string;

  eventName: string;

  date: Date | string;

  hour: string | null;

  price: string | null;

  images: Array<{
    id: string;
    url: string;
    sortOrder: number;
  }>;

  place: {
    id: string;

    placeName: string;

    placeCity: string | null;
  };

  _count: {
    plans: number;

    comments: number;

    savedBy: number;
  };
};

export function EventsManager() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [error, setError] = useState<string | null>(null);

  const events = trpc.panel.events.list.useQuery({
    page,
    pageSize,

    search: debouncedSearch.trim() || undefined,
  });

  const deleteEvent = trpc.panel.events.delete.useMutation();

  async function handleDelete(eventId: string, name: string) {
    const confirmed = window.confirm(`رویداد «${name}» حذف شود؟`);

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
            مدیریت رویدادهای فانیما
          </Text>
        </div>

        <Button
          type="button"
          startIcon={<FiPlus />}
          onClick={() => router.push("/panel/events/new")}
        >
          افزودن رویداد
        </Button>
      </div>

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
          onClear={() => {
            setSearch("");

            setDebouncedSearch("");

            setPage(1);
          }}
          placeholder="جستجو با نام رویداد یا مکان..."
        />
      </div>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {events.isPending && (
        <Text tone="secondary">در حال دریافت رویدادها...</Text>
      )}

      {events.error && (
        <InlineMessage variant="error">
          دریافت رویدادها انجام نشد.
        </InlineMessage>
      )}

      {events.data && (
        <EventsTable
          events={events.data.items as EventListItem[]}
          deleting={deleteEvent.isPending}
          onEdit={(eventId) => router.push(`/panel/events/${eventId}`)}
          onDelete={handleDelete}
        />
      )}

      {events.data && events.data.pagination.totalPages > 1 && (
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
    </div>
  );
}

function EventsTable({
  events,
  deleting,
  onEdit,
  onDelete,
}: {
  events: EventListItem[];

  deleting: boolean;

  onEdit: (eventId: string) => void;

  onDelete: (eventId: string, name: string) => void | Promise<unknown>;
}) {
  if (events.length === 0) {
    return (
      <div
        className="
          rounded-xl
          border
          border-dashed
          border-(--color-border)
          bg-(--color-surface)
          p-10
          text-center
        "
      >
        <FiCalendar size={32} className="mx-auto" />

        <Text variant="heading-md" className="mt-4">
          رویدادی پیدا نشد
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
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 text-right">
            <tr>
              <TableHead>رویداد</TableHead>

              <TableHead>مکان</TableHead>

              <TableHead>تاریخ</TableHead>

              <TableHead>قیمت</TableHead>

              <TableHead>فعالیت</TableHead>

              <TableHead>عملیات</TableHead>
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
                      image={event.images[0]?.url ?? null}
                      name={event.eventName}
                    />

                    <Text variant="label-md">{event.eventName}</Text>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div>
                    <Text variant="label-md">{event.place.placeName}</Text>

                    {event.place.placeCity && (
                      <Text variant="caption" tone="secondary">
                        {event.place.placeCity}
                      </Text>
                    )}
                  </div>
                </td>

                <td className="px-5 py-4">
                  {formatDate(event.date)}

                  {event.hour && ` - ${event.hour}`}
                </td>

                <td className="px-5 py-4">
                  {event.price
                    ? `${Number(event.price).toLocaleString("fa-IR")} تومان`
                    : "رایگان"}
                </td>

                <td className="px-5 py-4">
                  <div className="space-y-1 text-sm">
                    <div>{event._count.plans} برنامه</div>

                    <div>{event._count.comments} نظر</div>
                  </div>
                </td>

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
          flex h-14 w-14
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-(--color-brand-50)
          text-(--color-brand-500)
        "
      >
        <FiCalendar />
      </div>
    );
  }

  return (
    <div
      className="
        relative
        h-14 w-14
        shrink-0
        overflow-hidden
        rounded-lg
      "
    >
      <Image
        src={image}
        alt={name}
        fill
        sizes="56px"
        className="object-cover"
      />
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="
        whitespace-nowrap
        px-5 py-4
        text-sm font-semibold
      "
    >
      {children}
    </th>
  );
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
