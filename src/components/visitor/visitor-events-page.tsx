"use client";

import { useMemo, useState } from "react";

import { FiSearch } from "react-icons/fi";
import { FaFire } from "react-icons/fa";

import { useEventSave } from "@/hooks/visitor/use-event-save";

import {
  InlineMessage,
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
  const [saveError, setSaveError] = useState<string | null>(null);

  /*
   * از همان API شهرهای Home استفاده می‌کنیم
   * چون منبع اصلی شهرها Placeها هستند.
   */
  const cities = trpc.visitor.home.getCities.useQuery();

  const events = trpc.visitor.events.list.useQuery({
    page: 1,
    pageSize: 24,
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
      <div className="pb-2">
        <EventsIntro />

        <section className="mt-8">
          <div
            className="
              grid
              grid-cols-[175px_minmax(0,1fr)]
              gap-3

              sm:grid-cols-[85px_minmax(0,1fr)]
              sm:gap-4
            "
          >
            <div
              className="
                min-w-0
                rounded-full
                bg-white
              "
            >
              <SearchInput
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                onDebouncedChange={(value) => {
                  setDebouncedSearch(value);
                }}
                onClear={() => {
                  setSearch("");
                  setDebouncedSearch("");
                }}
                placeholder="جستجو"
              />
            </div>
            <div
              className="
                min-w-0
                rounded-full
                bg-white
              "
            >
              <SearchSelect
                value={city}
                options={cityOptions}
                onChange={setCity}
                placeholder="شهر"
                searchPlaceholder="جستجوی شهر..."
                emptyMessage="شهری پیدا نشد."
                disabled={cities.isPending}
                clearable
              />
            </div>
          </div>
        </section>

        {saveError && (
          <div className="mt-5">
            <InlineMessage variant="error">{saveError}</InlineMessage>
          </div>
        )}

        <div className="mt-12">
          {events.isPending && <EventsLoading />}

          {events.error && (
            <InlineMessage variant="error">
              دریافت ایونت‌ها انجام نشد.
            </InlineMessage>
          )}

          {events.data && events.data.items.length === 0 && <EmptyEvents />}

          {events.data && events.data.items.length > 0 && (
            <section
              className="
                mx-auto
                w-full
                max-w-[760px]
              "
            >
              <div className="mb-5">
                <Text
                  as="h2"
                  variant="heading-md"
                  className="
                    text-[22px]
                    font-black
                    leading-[1.4]
                    tracking-[-0.25px]
                    text-[#080d16]

                    sm:text-[24px]
                  "
                >
                  ایونت‌ها
                </Text>

                <Text variant="body-sm" tone="secondary" className="mt-1">
                  {events.data.pagination.total.toLocaleString("fa-IR")} ایونت
                  پیدا شد
                </Text>
              </div>

              <div
                className="
                  flex
                  flex-col
                  gap-9
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
            </section>
          )}
        </div>

        <div className="mt-20">
          <VisitorFooter />
        </div>
      </div>
    </VisitorPageShell>
  );
}

function EventsIntro() {
  return (
    <div
      className="
        pt-1
        text-center
      "
    >
      <div
        className="
          inline-flex
          items-center
          justify-center
          gap-2
        "
      >
        <Text
          as="h1"
          variant="heading-xl"
          className="
            text-[27px]
            font-black
            leading-[1.35]
            tracking-[-0.4px]
            text-[#07111f]

            sm:text-[31px]
          "
        >
          جذاب ترین ایونت های این ماه !
        </Text>
      </div>
    </div>
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
      "
    >
      <div
        className="
          mx-auto
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-[20px]
          bg-(--color-brand-50)
          text-xl
          text-(--color-brand-500)
        "
      >
        <FiSearch />
      </div>

      <Text variant="heading-md" className="mt-4">
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
    <div
      className="
        mx-auto
        w-full
        max-w-[760px]
        space-y-9
      "
    >
      {[1, 2, 3].map((item) => (
        <div key={item}>
          <div
            className="
              aspect-[1.68/1]
              w-full
              animate-pulse
              rounded-[28px]
              bg-gray-200
            "
          />

          <div className="mt-4 space-y-3">
            <div
              className="
                h-6
                w-2/3
                animate-pulse
                rounded
                bg-gray-200
              "
            />

            <div
              className="
                h-4
                w-1/2
                animate-pulse
                rounded
                bg-gray-200
              "
            />

            <div
              className="
                h-4
                w-5/6
                animate-pulse
                rounded
                bg-gray-200
              "
            />
          </div>
        </div>
      ))}
    </div>
  );
}
