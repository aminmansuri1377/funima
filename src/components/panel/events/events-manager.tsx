"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  FiCalendar,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";

import { Button, InlineMessage, Input, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function EventsManager() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const events = trpc.panel.events.list.useQuery({
    search: search.trim() || undefined,
  });

  const deleteEvent = trpc.panel.events.delete.useMutation();

  const [error, setError] = useState<string | null>(null);

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

      <div
        className="
          rounded-xl
          border border-(--color-border)
          bg-(--color-surface)
          p-4
        "
      >
        <div className="relative">
          <FiSearch
            className="
              absolute
              right-5 top-1/2
              -translate-y-1/2
              text-(--color-text-secondary)
            "
          />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجوی نام رویداد یا مکان..."
            className="pr-12"
          />
        </div>
      </div>

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
            <table className="w-full min-w-[1000px]">
              <thead
                className="
                  bg-gray-50
                  text-right
                "
              >
                <tr>
                  <th className="px-5 py-4">رویداد</th>

                  <th className="px-5 py-4">مکان</th>

                  <th className="px-5 py-4">تاریخ</th>

                  <th className="px-5 py-4">ساعت</th>

                  <th className="px-5 py-4">قیمت</th>

                  <th className="px-5 py-4">برنامه‌ها</th>

                  <th className="px-5 py-4">ذخیره</th>

                  <th className="px-5 py-4">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {events.data.map((event) => (
                  <tr
                    key={event.id}
                    className="
                        border-t
                        border-(--color-border)
                      "
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <PlaceImage
                          url={event.place.images[0]?.url ?? null}
                          name={event.eventName}
                        />

                        <Text variant="label-md">{event.eventName}</Text>
                      </div>
                    </td>

                    <td className="px-5 py-4">{event.place.placeName}</td>

                    <td className="px-5 py-4">
                      {new Intl.DateTimeFormat("fa-IR").format(
                        new Date(event.date),
                      )}
                    </td>

                    <td className="px-5 py-4">{event.hour ?? "—"}</td>

                    <td className="px-5 py-4">
                      {event.price
                        ? `${event.price} تومان`
                        : "رایگان / ثبت نشده"}
                    </td>

                    <td className="px-5 py-4">{event._count.plans}</td>

                    <td className="px-5 py-4">{event._count.savedBy}</td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          startIcon={<FiEdit2 />}
                          onClick={() =>
                            router.push(`/panel/events/${event.id}`)
                          }
                        >
                          ویرایش
                        </Button>

                        <Button
                          size="sm"
                          variant="tertiary"
                          startIcon={<FiTrash2 />}
                          disabled={deleteEvent.isPending}
                          onClick={() =>
                            handleDelete(event.id, event.eventName)
                          }
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
      )}

      {events.data?.length === 0 && (
        <div className="py-12 text-center">
          <FiCalendar size={32} className="mx-auto mb-3" />

          <Text variant="heading-md">رویدادی وجود ندارد</Text>
        </div>
      )}
    </div>
  );
}

function PlaceImage({ url, name }: { url: string | null; name: string }) {
  if (!url) {
    return (
      <div
        className="
          h-12 w-12
          shrink-0
          rounded-md
          bg-gray-100
        "
      />
    );
  }

  return (
    <div
      className="
        relative h-12 w-12
        shrink-0 overflow-hidden
        rounded-md
      "
    >
      <Image src={url} alt={name} fill sizes="48px" className="object-cover" />
    </div>
  );
}
