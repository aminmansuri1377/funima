"use client";

import Image from "next/image";

import { useMemo, useState } from "react";

import { FaFire } from "react-icons/fa";
import { useEventSave } from "@/hooks/visitor/use-event-save";
import { FiCalendar, FiSearch } from "react-icons/fi";

import {
  InlineMessage,
  Pagination,
  SearchInput,
  SearchSelect,
  Text,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

import {
  EventCard,
  VisitorFooter,
  VisitorPageShell,
} from "@/components/visitor";

export function VisitorEventsPage() {
  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [city, setCity] = useState("");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [saveError, setSaveError] = useState<string | null>(null);

  /*
   * از همان API شهرهای Home استفاده می‌کنیم
   * چون منبع اصلی شهرها Placeها هستند.
   */
  const cities = trpc.visitor.home.getCities.useQuery();

  const events = trpc.visitor.events.list.useQuery({
    page,

    pageSize,

    search: debouncedSearch.trim() || undefined,

    city: city || undefined,

    upcomingOnly: true,
  });

  const eventSave = useEventSave();
  const cityOptions = useMemo(() => {
    return (
      cities.data?.map((item) => ({
        value: item.city,

        label: item.province ? `${item.city}، ${item.province}` : item.city,
      })) ?? []
    );
  }, [cities.data]);
  async function handleSaveChange(eventId: string, nextSaved: boolean) {
    setSaveError(null);

    try {
      await eventSave.toggle(eventId, nextSaved);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "تغییر وضعیت ذخیره ایونت انجام نشد.",
      );

      throw error;
    }
  }

  return (
    <VisitorPageShell maxWidth="wide">
      <div className="space-y-8">
        <EventsHeader />

        <section
          className="
            rounded-[28px]
            bg-white
            p-4
            shadow-[0_8px_30px_rgba(0,0,0,0.035)]
            sm:p-5
          "
        >
          <div
            className="
              grid
              gap-3
              md:grid-cols-[1fr_280px]
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
              placeholder="دنبال چه ایونتی می‌گردی؟"
            />

            <SearchSelect
              value={city}
              options={cityOptions}
              onChange={(value) => {
                setCity(value);

                setPage(1);
              }}
              placeholder="انتخاب شهر"
              searchPlaceholder="جستجوی شهر..."
              emptyMessage="شهری پیدا نشد."
              disabled={cities.isPending}
              clearable
            />
          </div>
        </section>

        {saveError && (
          <InlineMessage variant="error">{saveError}</InlineMessage>
        )}

        {events.isPending && <EventsLoading />}

        {events.error && (
          <InlineMessage variant="error">
            دریافت ایونت‌ها انجام نشد.
          </InlineMessage>
        )}

        {events.data && events.data.items.length === 0 && <EmptyEvents />}

        {events.data && events.data.items.length > 0 && (
          <section>
            <div
              className="
                  flex
                  items-end
                  justify-between
                  gap-4
                "
            >
              <div>
                <Text as="h2" variant="heading-md">
                  ایونت‌ها
                </Text>

                <Text variant="body-sm" tone="secondary" className="mt-1">
                  {events.data.pagination.total.toLocaleString("fa-IR")} ایونت
                  پیدا شد
                </Text>
              </div>
            </div>

            <div
              className="
                  mt-5
                  grid
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
            >
              {events.data.items.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSaveChange={handleSaveChange}
                />
              ))}
            </div>

            {events.data.pagination.totalPages > 1 && (
              <div
                className="
                    mt-8
                    rounded-3xl
                    bg-white
                    p-4
                    shadow-sm
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
          </section>
        )}

        <VisitorFooter />
      </div>
    </VisitorPageShell>
  );
}

function EventsHeader() {
  return (
    <header
      className="
        flex
        items-center
        justify-between
        gap-4
        pt-1
      "
    >
      <div>
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <FaFire
            className="
              text-2xl
              text-(--color-brand-500)
            "
          />

          <Text as="h1" variant="heading-xl">
            جذاب‌ترین ایونت‌ها
          </Text>
        </div>

        <Text tone="secondary" className="mt-2">
          رویدادهای نزدیک و جذاب فونیما رو پیدا کن
        </Text>
      </div>

      <div
        className="
          relative
          h-14
          w-14
          shrink-0
        "
      >
        <Image
          src="/images/logo.png"
          alt="فونیما"
          fill
          sizes="56px"
          className="object-contain"
        />
      </div>
    </header>
  );
}

function EmptyEvents() {
  return (
    <div
      className="
        rounded-[30px]
        bg-white
        px-5
        py-14
        text-center
        shadow-[0_8px_30px_rgba(0,0,0,0.03)]
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
          text-2xl
          text-(--color-brand-500)
        "
      >
        <FiSearch />
      </div>

      <Text variant="heading-md" className="mt-5">
        ایونتی پیدا نشد
      </Text>

      <Text tone="secondary" className="mt-2">
        عبارت جستجو یا شهر انتخاب‌شده را تغییر بده.
      </Text>
    </div>
  );
}

function EventsLoading() {
  return (
    <div>
      <div
        className="
          h-7
          w-32
          animate-pulse
          rounded-lg
          bg-gray-200
        "
      />

      <div
        className="
          mt-5
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="
                overflow-hidden
                rounded-[26px]
                bg-white
              "
          >
            <div
              className="
                  aspect-[16/10]
                  animate-pulse
                  bg-gray-100
                "
            />

            <div className="space-y-3 p-5">
              <div
                className="
                    h-6
                    w-2/3
                    animate-pulse
                    rounded
                    bg-gray-100
                  "
              />

              <div
                className="
                    h-4
                    w-1/2
                    animate-pulse
                    rounded
                    bg-gray-100
                  "
              />

              <div
                className="
                    h-12
                    animate-pulse
                    rounded-xl
                    bg-gray-100
                  "
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
