"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  FiBookmark,
  FiCalendar,
  FiClock,
  FiEdit2,
  FiMessageCircle,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import {
  Button,
  InlineMessage,
  Pagination,
  SearchInput,
  Text,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

export function HostEventsList() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [error, setError] = useState<string | null>(null);

  const events = trpc.host.events.list.useQuery({
    page,
    pageSize,

    search: debouncedSearch.trim() || undefined,
  });

  const deleteEvent = trpc.host.events.delete.useMutation();

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
    <div className="space-y-5">
      <div
        className="
          flex flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            ایونت‌های شما
          </Text>

          <Text tone="secondary" className="mt-1">
            رویدادهای کسب‌وکار خود را مدیریت کنید
          </Text>
        </div>

        <Button
          type="button"
          startIcon={<FiPlus />}
          onClick={() => router.push("/host/events/new")}
        >
          افزودن ایونت
        </Button>
      </div>

      <div
        className="
          rounded-3xl
          bg-white
          p-4
          shadow-sm
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
          placeholder="جستجو بین ایونت‌ها..."
        />
      </div>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {events.isPending && (
        <Text tone="secondary">در حال دریافت ایونت‌ها...</Text>
      )}

      {events.error && (
        <InlineMessage variant="error">
          دریافت ایونت‌ها انجام نشد.
        </InlineMessage>
      )}

      {events.data && events.data.items.length === 0 && (
        <div
          className="
              rounded-[30px]
              bg-white
              p-12
              text-center
              shadow-sm
            "
        >
          <FiCalendar
            size={38}
            className="
                mx-auto
                text-(--color-brand-500)
              "
          />

          <Text variant="heading-md" className="mt-4">
            هنوز ایونتی ندارید
          </Text>
        </div>
      )}

      {events.data && events.data.items.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {events.data.items.map((event) => (
              <article
                key={event.id}
                className="
                      overflow-hidden
                      rounded-[28px]
                      bg-white
                      shadow-sm
                    "
              >
                <EventImage
                  image={event.images[0]?.url ?? null}
                  name={event.eventName}
                />

                <div className="p-5">
                  <Text variant="heading-md">{event.eventName}</Text>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <MetaPill icon={<FiCalendar />}>
                      {formatDate(event.date)}
                    </MetaPill>

                    {event.hour && (
                      <MetaPill icon={<FiClock />}>{event.hour}</MetaPill>
                    )}
                  </div>

                  <Text variant="label-lg" className="mt-4">
                    {event.price
                      ? `${Number(event.price).toLocaleString("fa-IR")} تومان`
                      : "رایگان"}
                  </Text>

                  <div
                    className="
                          mt-4
                          flex gap-4
                          text-sm
                          text-(--color-text-secondary)
                        "
                  >
                    <span>{event._count.plans} برنامه</span>

                    <span className="flex items-center gap-1">
                      <FiMessageCircle />

                      {event._count.comments}
                    </span>

                    <span className="flex items-center gap-1">
                      <FiBookmark />

                      {event._count.savedBy}
                    </span>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      startIcon={<FiEdit2 />}
                      onClick={() => router.push(`/host/events/${event.id}`)}
                    >
                      مشاهده و ویرایش
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      startIcon={<FiTrash2 />}
                      disabled={deleteEvent.isPending}
                      onClick={() => handleDelete(event.id, event.eventName)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {events.data.pagination.totalPages > 1 && (
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

function EventImage({ image, name }: { image: string | null; name: string }) {
  if (!image) {
    return (
      <div
        className="
          flex aspect-video
          items-center
          justify-center
          bg-(--color-brand-50)
          text-(--color-brand-500)
        "
      >
        <FiCalendar size={42} />
      </div>
    );
  }

  return (
    <div className="relative aspect-video">
      <Image
        src={image}
        alt={name}
        fill
        sizes="(max-width:768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}

function MetaPill({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className="
        inline-flex
        items-center gap-1.5
        rounded-full
        bg-gray-50
        px-3 py-2
        text-sm
        text-(--color-text-secondary)
      "
    >
      {icon}
      {children}
    </span>
  );
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
