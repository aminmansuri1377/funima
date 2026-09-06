"use client";

import { useRouter } from "next/navigation";

import {
  FiBookmark,
  FiCalendar,
  FiClock,
  FiEdit2,
  FiList,
  FiMapPin,
  FiMessageCircle,
  FiPlus,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { ImageSlider, InlineMessage, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function HostLatestEvent() {
  const router = useRouter();

  const latest = trpc.host.dashboard.latestEvent.useQuery();

  if (latest.isPending) {
    return <EventLoading />;
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

  return (
    <div>
      {/*
       * ========================================
       * EVENT IMAGE
       * ========================================
       */}

      <ImageSlider
        images={event.images.map((image) => ({
          id: image.id,

          url: image.url,

          alt: event.eventName,
        }))}
        alt={event.eventName}
        priority
        aspectClassName="
          aspect-[1.05/1]
          sm:aspect-[16/9]
        "
        fallback={<FiCalendar size={50} />}
      />

      {/*
       * ========================================
       * EDIT BUTTON
       * ========================================
       */}

      <div
        className="
          mt-5
          flex
          justify-center
        "
      >
        <button
          type="button"
          onClick={() => router.push(`/host/events/${event.id}`)}
          className="
            inline-flex
            min-h-11
            min-w-[175px]
            items-center
            justify-center
            gap-2
            rounded-full
            border
            border-[#ff6437]
            px-6
            text-[14px]
            font-semibold
            text-[#ff6437]
            transition-colors

            hover:bg-[#fff4ef]
          "
        >
          <FiEdit2 />
          ویرایش ایونت
        </button>
      </div>

      {/*
       * ========================================
       * SUMMARY
       * ========================================
       */}

      <section
        className="
          mt-7
          text-center
        "
      >
        <Text
          as="h1"
          className="
            text-[25px]
            font-black
            leading-10
            text-[#07111f]

            sm:text-[29px]
          "
        >
          {event.eventName}
        </Text>

        <Text
          className="
            mt-2
            text-[13px]
            font-semibold
            text-[#444b55]
          "
        >
          برگزارکننده : {event.place.placeName}
        </Text>

        {event.description && (
          <Text
            tone="secondary"
            className="
              mx-auto
              mt-4
              max-w-lg
              text-[14px]
              leading-7
            "
          >
            {event.description}
          </Text>
        )}

        <div
          className="
            mt-5
            flex
            items-center
            justify-center
            gap-5
            text-[12px]
            text-[#707781]
          "
        >
          <span
            className="
              inline-flex
              items-center
              gap-1.5
            "
          >
            <FiBookmark />

            {event._count.savedBy.toLocaleString("fa-IR")}
          </span>

          <span
            className="
              inline-flex
              items-center
              gap-1.5
            "
          >
            <FiMessageCircle />

            {event._count.comments.toLocaleString("fa-IR")}
          </span>
        </div>
      </section>

      {/*
       * ========================================
       * PRICE
       * ========================================
       */}

      <div
        className="
          mx-auto
          mt-7
          flex
          min-h-[48px]
          max-w-[360px]
          items-center
          justify-center
          rounded-full
          bg-white
          px-5
          text-center
        "
      >
        <Text
          className="
            text-[15px]
            font-black
            text-[#202733]
          "
        >
          قیمت بلیط ها :{" "}
          {event.price
            ? `${Number(event.price).toLocaleString("fa-IR")} تومان`
            : "رایگان"}
        </Text>
      </div>

      {/*
       * ========================================
       * EVENT INFO
       * ========================================
       */}

      <section className="mt-9">
        <SectionTitle>اطلاعات ایونت :</SectionTitle>

        <div
          className="
            mt-4
            space-y-3
          "
        >
          <InformationRow icon={<FiCalendar />}>
            {formatDate(event.date)}
          </InformationRow>

          <InformationRow icon={<FiClock />}>
            {event.hour ? `ساعت ${event.hour}` : "ساعت ثبت نشده"}
          </InformationRow>

          <InformationRow icon={<FiMapPin />}>
            {[
              event.place.placeProvince,

              event.place.placeCity,

              event.place.placeName,
            ]
              .filter(Boolean)
              .join(" - ")}
          </InformationRow>
        </div>
      </section>

      {/*
       * ========================================
       * ABOUT
       * ========================================
       */}

      {event.info && (
        <section className="mt-9">
          <SectionTitle>درباره ایونت :</SectionTitle>

          <div
            className="
              mt-4
              rounded-[22px]
              bg-white
              px-5
              py-5
            "
          >
            <Text
              className="
                whitespace-pre-wrap
                text-[14px]
                leading-8
                text-[#444b55]
              "
            >
              {event.info}
            </Text>
          </div>
        </section>
      )}

      {/*
       * ========================================
       * SUITABLE
       * ========================================
       */}

      {event.suitable && (
        <section className="mt-9">
          <SectionTitle>مناسب برای :</SectionTitle>

          <BulletList values={toListItems(event.suitable)} icon={<FiUsers />} />
        </section>
      )}

      {/*
       * ========================================
       * PROGRAM COUNT
       * ========================================
       */}

      {event._count.plans > 0 && (
        <section className="mt-9">
          <SectionTitle>برنامه ایونت :</SectionTitle>

          <button
            type="button"
            onClick={() => router.push(`/host/events/${event.id}`)}
            className="
              mt-4
              flex
              min-h-[48px]
              w-full
              items-center
              justify-between
              rounded-full
              bg-white
              px-5
              text-[14px]
              text-[#303640]
            "
          >
            <span>مشاهده برنامه کامل ایونت</span>

            <span
              className="
                text-[13px]
                font-bold
                text-[#ff6437]
              "
            >
              {event._count.plans.toLocaleString("fa-IR")} برنامه
            </span>
          </button>
        </section>
      )}

      {/*
       * ========================================
       * RULES
       * ========================================
       */}

      {event.rule && (
        <section className="mt-9">
          <SectionTitle>قوانین :</SectionTitle>

          <BulletList values={toListItems(event.rule)} icon={<FiShield />} />
        </section>
      )}

      {/*
       * ========================================
       * SECONDARY ACTIONS
       * ========================================
       */}

      <div
        className="
          mt-12
          flex
          flex-col
          items-center
          justify-center
          gap-3

          sm:flex-row
        "
      >
        <button
          type="button"
          onClick={() => router.push("/host/events")}
          className="
            inline-flex
            min-h-11
            items-center
            justify-center
            gap-2
            rounded-full
            border
            border-[#d1d1d1]
            px-5
            text-[13px]
            font-semibold
            text-[#565d66]
          "
        >
          <FiList />
          مشاهده همه ایونت ها
        </button>

        <button
          type="button"
          onClick={() => router.push("/host/events/new")}
          className="
            inline-flex
            min-h-11
            items-center
            justify-center
            gap-2
            rounded-full
            border
            border-[#ff6437]
            px-5
            text-[13px]
            font-semibold
            text-[#ff6437]
          "
        >
          <FiPlus />
          ایونت جدید
        </button>
      </div>
    </div>
  );
}

/* =====================================================
 * SECTION TITLE
 * ===================================================== */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      as="h2"
      className="
        text-[16px]
        font-black
        leading-7
        text-[#111827]

        sm:text-[18px]
      "
    >
      {children}
    </Text>
  );
}

/* =====================================================
 * INFORMATION ROW
 * ===================================================== */

function InformationRow({
  icon,
  children,
}: {
  icon: React.ReactNode;

  children: React.ReactNode;
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
      "
    >
      <span
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-white
          text-[17px]
          text-[#ff6437]
        "
      >
        {icon}
      </span>

      <Text
        className="
          pt-1
          text-[14px]
          leading-7
          text-[#414852]
        "
      >
        {children}
      </Text>
    </div>
  );
}

/* =====================================================
 * BULLET LIST
 * ===================================================== */

function BulletList({
  values,
  icon,
}: {
  values: string[];

  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        mt-4
        space-y-2
      "
    >
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="
              flex
              items-start
              gap-2.5
            "
        >
          <span
            className="
                mt-[9px]
                h-[7px]
                w-[7px]
                shrink-0
                rounded-full
                bg-[#ff6437]
              "
          />

          <Text
            className="
                text-[14px]
                leading-7
                text-[#3f4650]
              "
          >
            {value}
          </Text>

          <span className="sr-only">{icon}</span>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
 * EMPTY
 * ===================================================== */

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
        rounded-[28px]
        bg-white
        px-5
        py-14
        text-center
      "
    >
      <FiCalendar
        size={38}
        className="
          mx-auto
          text-[#ff6437]
        "
      />

      <Text variant="heading-md" className="mt-5">
        هنوز ایونتی ندارید
      </Text>

      <Text tone="secondary" className="mt-2">
        اولین ایونت مجموعه خود را بسازید.
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
        <button
          type="button"
          onClick={onCreate}
          className="
            inline-flex
            min-h-11
            items-center
            justify-center
            gap-2
            rounded-full
            bg-[#ff6437]
            px-5
            font-semibold
            text-white
          "
        >
          <FiPlus />
          ساخت ایونت
        </button>

        <button
          type="button"
          onClick={onAll}
          className="
            inline-flex
            min-h-11
            items-center
            justify-center
            gap-2
            rounded-full
            border
            border-[#d2d2d2]
            px-5
            font-semibold
            text-[#565d66]
          "
        >
          <FiList />
          صفحه ایونت ها
        </button>
      </div>
    </div>
  );
}

/* =====================================================
 * LOADING
 * ===================================================== */

function EventLoading() {
  return (
    <div>
      <div
        className="
          aspect-[1.05/1]
          animate-pulse
          rounded-[26px]
          bg-gray-200

          sm:aspect-[16/9]
        "
      />

      <div
        className="
          mx-auto
          mt-5
          h-11
          w-44
          animate-pulse
          rounded-full
          bg-gray-200
        "
      />

      <div
        className="
          mx-auto
          mt-7
          h-8
          w-2/3
          animate-pulse
          rounded
          bg-gray-200
        "
      />

      <div
        className="
          mx-auto
          mt-3
          h-4
          w-1/3
          animate-pulse
          rounded
          bg-gray-200
        "
      />
    </div>
  );
}

/* =====================================================
 * HELPERS
 * ===================================================== */

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",

    year: "numeric",

    month: "long",

    day: "numeric",
  }).format(new Date(value));
}

function toListItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-•●▪◦\s]+/, "").trim())
    .filter(Boolean);
}
