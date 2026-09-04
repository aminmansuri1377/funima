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
    return <LatestEventLoading />;
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

  const image = event.place.images[0]?.url ?? null;

  return (
    <div className="space-y-4">
      <div
        className="
          flex
          flex-col
          gap-4
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
            آخرین رویدادی که برای مجموعه ثبت کرده‌اید
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
          shadow-[0_8px_30px_rgba(0,0,0,0.05)]
        "
      >
        <div
          className="
            relative
            aspect-4/3
            overflow-hidden
            bg-gray-100
            sm:aspect-16/7
          "
        >
          {image ? (
            <>
              <Image
                src={image}
                alt={event.eventName}
                fill
                priority
                sizes="(max-width:768px) 100vw, 1000px"
                className="object-cover"
              />

              <div
                className="
                  absolute
                  inset-x-0
                  bottom-0
                  h-40
                  bg-linear-to-t
                  from-black/50
                  via-black/10
                  to-transparent
                "
              />
            </>
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
              <FiCalendar size={50} />
            </div>
          )}

          <div
            className="
              absolute
              left-4
              top-4
              rounded-[18px]
              bg-white/95
              px-4
              py-2.5
              text-center
              shadow-sm
              backdrop-blur
            "
          >
            <Text variant="heading-md">{formatDay(event.date)}</Text>

            <Text variant="caption" tone="secondary">
              {formatMonth(event.date)}
            </Text>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >
            <div className="min-w-0">
              <Text as="h2" variant="heading-xl">
                {event.eventName}
              </Text>

              <Text tone="secondary" className="mt-2">
                {event.place.placeName}
              </Text>
            </div>

            <div
              className="
                grid
                grid-cols-3
                gap-2
                lg:min-w-[300px]
              "
            >
              <CountBox value={event._count.plans} label="برنامه" />

              <CountBox
                icon={<FiMessageCircle />}
                value={event._count.comments}
                label="نظر"
              />

              <CountBox
                icon={<FiBookmark />}
                value={event._count.savedBy}
                label="ذخیره"
              />
            </div>
          </div>

          <div
            className="
              mt-5
              flex
              flex-wrap
              gap-2
            "
          >
            <MetaPill icon={<FiCalendar />}>{formatDate(event.date)}</MetaPill>

            {event.hour && <MetaPill icon={<FiClock />}>{event.hour}</MetaPill>}

            <MetaPill>
              {event.price
                ? `${Number(event.price).toLocaleString("fa-IR")} تومان`
                : "رایگان"}
            </MetaPill>
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

          <div
            className="
              mt-6
              flex
              flex-col
              gap-2
              sm:flex-row
            "
          >
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
    <div className="space-y-4">
      <div>
        <Text as="h1" variant="heading-xl">
          ایونت شما
        </Text>

        <Text tone="secondary" className="mt-1">
          آخرین ایونت ثبت‌شده اینجا نمایش داده می‌شود
        </Text>
      </div>

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
            text-2xl
            text-(--color-brand-500)
          "
        >
          <FiCalendar />
        </div>

        <Text variant="heading-md" className="mt-5">
          هنوز ایونتی ثبت نکرده‌اید
        </Text>

        <Text
          tone="secondary"
          className="
            mx-auto
            mt-2
            max-w-md
          "
        >
          اولین رویداد مجموعه را ایجاد کنید تا در این بخش نمایش داده شود.
        </Text>

        <div
          className="
            mt-6
            flex
            flex-col
            justify-center
            gap-2
            sm:flex-row
          "
        >
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
    </div>
  );
}

function CountBox({
  value,
  label,
  icon,
}: {
  value: number;

  label: string;

  icon?: React.ReactNode;
}) {
  return (
    <div
      className="
        flex
        min-h-20
        flex-col
        items-center
        justify-center
        rounded-[20px]
        bg-[#f8f8f8]
        p-3
        text-center
      "
    >
      {icon && (
        <span
          className="
            mb-1
            text-(--color-brand-500)
          "
        >
          {icon}
        </span>
      )}

      <Text variant="label-lg">{value.toLocaleString("fa-IR")}</Text>

      <Text variant="caption" tone="secondary">
        {label}
      </Text>
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
        bg-[#f8f8f8]
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

function LatestEventLoading() {
  return (
    <div className="space-y-4">
      <div
        className="
          h-14
          w-1/2
          animate-pulse
          rounded-xl
          bg-white
        "
      />

      <div
        className="
          overflow-hidden
          rounded-[30px]
          bg-white
        "
      >
        <div
          className="
            aspect-16/8
            animate-pulse
            bg-gray-100
          "
        />

        <div className="space-y-4 p-5">
          <div
            className="
              h-8
              w-2/3
              animate-pulse
              rounded
              bg-gray-100
            "
          />

          <div
            className="
              h-20
              animate-pulse
              rounded-[20px]
              bg-gray-100
            "
          />
        </div>
      </div>
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
