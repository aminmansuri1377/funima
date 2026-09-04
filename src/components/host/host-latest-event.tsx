"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";

import {
  FiBookmark,
  FiCalendar,
  FiClock,
  FiEye,
  FiList,
  FiMessageCircle,
  FiPlus,
} from "react-icons/fi";

import { Button, InlineMessage, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function HostLatestEvent() {
  const router = useRouter();

  const latest = trpc.host.dashboard.latestEvent.useQuery();

  if (latest.isPending) {
    return <Text tone="secondary">در حال دریافت آخرین ایونت...</Text>;
  }

  if (latest.error) {
    return (
      <InlineMessage variant="error">
        دریافت آخرین ایونت انجام نشد.
      </InlineMessage>
    );
  }

  if (!latest.data) {
    return (
      <EmptyLatestEvent
        onCreate={() => router.push("/host/events/new")}
        onAll={() => router.push("/host/events")}
      />
    );
  }

  const event = latest.data;

  /*
   * فقط تصویر Event.
   * هیچ fallback به Place نداریم.
   */
  const image = event.images[0]?.url ?? null;

  return (
    <div className="space-y-4">
      <div
        className="
          flex flex-col gap-4
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            آخرین ایونت شما
          </Text>

          <Text tone="secondary" className="mt-1">
            آخرین رویدادی که ثبت کرده‌اید
          </Text>
        </div>

        <Button
          type="button"
          variant="secondary"
          startIcon={<FiList />}
          onClick={() => router.push("/host/events")}
        >
          مشاهده همه ایونت‌ها
        </Button>
      </div>

      <article
        className="
          overflow-hidden
          rounded-[30px]
          bg-white
          shadow-sm
        "
      >
        <div
          className="
            relative
            aspect-4/3
            overflow-hidden
            sm:aspect-16/7
          "
        >
          {image ? (
            <Image
              src={image}
              alt={event.eventName}
              fill
              priority
              sizes="(max-width:768px) 100vw, 1000px"
              className="object-cover"
            />
          ) : (
            <div
              className="
                flex h-full
                items-center
                justify-center
                bg-(--color-brand-50)
                text-(--color-brand-500)
              "
            >
              <FiCalendar size={50} />
            </div>
          )}
        </div>

        <div className="p-5 sm:p-7">
          <Text as="h2" variant="heading-xl">
            {event.eventName}
          </Text>

          <Text tone="secondary" className="mt-2">
            {event.place.placeName}
          </Text>

          <div className="mt-5 flex flex-wrap gap-2">
            <MetaPill icon={<FiCalendar />}>{formatDate(event.date)}</MetaPill>

            {event.hour && <MetaPill icon={<FiClock />}>{event.hour}</MetaPill>}

            <MetaPill>
              {event.price
                ? `${Number(event.price).toLocaleString("fa-IR")} تومان`
                : "رایگان"}
            </MetaPill>
          </div>

          <div className="mt-5 flex gap-4 text-sm text-(--color-text-secondary)">
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

          {event.description && (
            <Text
              tone="secondary"
              className="
                mt-5
                line-clamp-3
                leading-8
              "
            >
              {event.description}
            </Text>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              startIcon={<FiEye />}
              onClick={() => router.push(`/host/events/${event.id}`)}
            >
              مشاهده ایونت
            </Button>

            <Button
              type="button"
              variant="secondary"
              startIcon={<FiPlus />}
              onClick={() => router.push("/host/events/new")}
            >
              افزودن ایونت جدید
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}

function EmptyLatestEvent({
  onCreate,
  onAll,
}: {
  onCreate: () => void;
  onAll: () => void;
}) {
  return (
    <div
      className="
        rounded-[30px]
        bg-white
        px-5 py-14
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

      <Text variant="heading-md" className="mt-5">
        هنوز ایونتی ندارید
      </Text>

      <Text tone="secondary" className="mt-2">
        اولین ایونت مجموعه خود را بسازید.
      </Text>

      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button type="button" startIcon={<FiPlus />} onClick={onCreate}>
          ساخت ایونت
        </Button>

        <Button
          type="button"
          variant="secondary"
          startIcon={<FiList />}
          onClick={onAll}
        >
          صفحه ایونت‌ها
        </Button>
      </div>
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
        items-center
        gap-1.5
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
