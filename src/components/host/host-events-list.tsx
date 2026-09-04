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
          flex
          flex-col
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

      {events.data && (
        <div
          className="
            flex
            items-center
            gap-2
            rounded-[20px]
            bg-(--color-brand-50)
            px-4
            py-3
            text-sm
            text-(--color-brand-700)
          "
        >
          <FiCalendar />

          <span>
            مجموعاً{" "}
            <strong>
              {events.data.pagination.total.toLocaleString("fa-IR")}
            </strong>{" "}
            ایونت دارید
          </span>
        </div>
      )}

      <div
        className="
          rounded-[24px]
          bg-white
          p-3
          shadow-[0_8px_30px_rgba(0,0,0,0.04)]
          sm:p-4
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
          placeholder="جستجو بین ایونت‌های شما..."
        />
      </div>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {events.isPending && <EventsLoading />}

      {events.error && (
        <InlineMessage variant="error">
          دریافت ایونت‌ها انجام نشد.
        </InlineMessage>
      )}

      {events.data && events.data.items.length === 0 && (
        <EmptyEvents onCreate={() => router.push("/host/events/new")} />
      )}

      {events.data && events.data.items.length > 0 && (
        <>
          <div
            className="
              grid
              gap-4
              md:grid-cols-2
            "
          >
            {events.data.items.map((event) => (
              <article
                key={event.id}
                className="
                  group
                  overflow-hidden
                  rounded-[28px]
                  bg-white
                  shadow-[0_8px_30px_rgba(0,0,0,0.04)]
                  transition-transform
                  duration-200
                  hover:-translate-y-0.5
                "
              >
                <button
                  type="button"
                  className="block w-full text-right"
                  onClick={() => router.push(`/host/events/${event.id}`)}
                >
                  <EventImage
                    image={event.place.images[0]?.url ?? null}
                    name={event.eventName}
                    date={event.date}
                  />

                  <div className="p-5">
                    <Text variant="heading-md" className="line-clamp-2">
                      {event.eventName}
                    </Text>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <MetaPill icon={<FiCalendar />}>
                        {formatDate(event.date)}
                      </MetaPill>

                      {event.hour && (
                        <MetaPill icon={<FiClock />}>{event.hour}</MetaPill>
                      )}
                    </div>

                    {event.price ? (
                      <div className="mt-5">
                        <Text variant="caption" tone="secondary">
                          هزینه هر نفر
                        </Text>

                        <Text variant="heading-md" className="mt-1">
                          {Number(event.price).toLocaleString("fa-IR")} تومان
                        </Text>
                      </div>
                    ) : (
                      <Text
                        variant="label-lg"
                        className="mt-5 text-(--color-brand-600)"
                      >
                        رایگان
                      </Text>
                    )}

                    <div
                      className="
                        mt-5
                        flex
                        items-center
                        gap-4
                        border-t
                        border-(--color-border)
                        pt-4
                        text-sm
                        text-(--color-text-secondary)
                      "
                    >
                      <EventCount value={event._count.plans}>برنامه</EventCount>

                      <EventCount
                        icon={<FiMessageCircle />}
                        value={event._count.comments}
                      >
                        نظر
                      </EventCount>

                      <EventCount
                        icon={<FiBookmark />}
                        value={event._count.savedBy}
                      >
                        ذخیره
                      </EventCount>
                    </div>
                  </div>
                </button>

                <div
                  className="
                    flex
                    gap-2
                    border-t
                    border-(--color-border)
                    px-5
                    py-4
                  "
                >
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
              </article>
            ))}
          </div>

          {events.data.pagination.totalPages > 1 && (
            <div
              className="
                rounded-3xl
                bg-white
                p-4
                shadow-[0_8px_30px_rgba(0,0,0,0.04)]
              "
            >
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventImage({
  image,
  name,
  date,
}: {
  image: string | null;
  name: string;
  date: Date | string;
}) {
  return (
    <div className="relative aspect-video overflow-hidden bg-gray-100">
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="
            object-cover
            transition-transform
            duration-300
            group-hover:scale-[1.02]
          "
        />
      ) : (
        <div
          className="
            flex
            h-full
            items-center
            justify-center
            bg-(--color-brand-50)
            text-(--color-brand-500)
          "
        >
          <FiCalendar size={42} />
        </div>
      )}

      <div
        className="
          absolute
          left-3
          top-3
          min-w-14
          rounded-2xl
          bg-white/95
          px-3
          py-2
          text-center
          shadow-sm
          backdrop-blur
        "
      >
        <Text variant="label-lg">{formatDay(date)}</Text>

        <Text variant="caption" tone="secondary">
          {formatMonth(date)}
        </Text>
      </div>
    </div>
  );
}

function MetaPill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-gray-50
        px-3
        py-2
        text-sm
        text-(--color-text-secondary)
      "
    >
      {icon}
      {children}
    </span>
  );
}

function EventCount({
  value,
  icon,
  children,
}: {
  value: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}

      <span>{value.toLocaleString("fa-IR")}</span>

      <span>{children}</span>
    </span>
  );
}

function EmptyEvents({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="
        rounded-[30px]
        bg-white
        px-5
        py-14
        text-center
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
      "
    >
      <div
        className="
          mx-auto
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-[22px]
          bg-(--color-brand-50)
          text-(--color-brand-500)
        "
      >
        <FiCalendar size={30} />
      </div>

      <Text variant="heading-md" className="mt-5">
        هنوز ایونتی ندارید
      </Text>

      <Text tone="secondary" className="mx-auto mt-2 max-w-sm">
        اولین ایونت مجموعه خود را بسازید و اطلاعات کامل آن را برای کاربران
        فونیما منتشر کنید.
      </Text>

      <Button
        type="button"
        startIcon={<FiPlus />}
        className="mt-6"
        onClick={onCreate}
      >
        ساخت اولین ایونت
      </Button>
    </div>
  );
}

function EventsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="
            overflow-hidden
            rounded-[28px]
            bg-white
            shadow-sm
          "
        >
          <div className="aspect-video animate-pulse bg-gray-100" />

          <div className="space-y-3 p-5">
            <div className="h-6 w-2/3 animate-pulse rounded bg-gray-100" />

            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />

            <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function formatDay(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
  }).format(new Date(value));
}

function formatMonth(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
  }).format(new Date(value));
}
