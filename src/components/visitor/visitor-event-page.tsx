"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";
import { VisitorEventComments } from "./visitor-event-comments";
import {
  FiArrowRight,
  FiBookmark,
  FiCalendar,
  FiClock,
  FiInfo,
  FiMapPin,
  FiMessageCircle,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { useEventSave } from "@/hooks/visitor/use-event-save";
import type { inferRouterOutputs } from "@trpc/server";

import { ImageSlider, InlineMessage, Text } from "@/components/ui";

import type { AppRouter } from "@/server/trpc/root";

import { trpc } from "@/trpc/client";

import { EventCard } from "./event-card";

import { FavoriteButton } from "./favorite-button";

import { VisitorFooter } from "./visitor-footer";

import { VisitorPageShell } from "./visitor-page-shell";

type RouterOutputs = inferRouterOutputs<AppRouter>;

type EventData = RouterOutputs["visitor"]["events"]["getById"];

type Props = {
  eventId: string;

  canSave: boolean;

  canComment: boolean;
};

export function VisitorEventPage({ eventId, canSave, canComment }: Props) {
  const router = useRouter();

  const event = trpc.visitor.events.getById.useQuery({
    eventId,
  });

  const eventSave = useEventSave();
  async function handleSaveChange(nextSaved: boolean) {
    await eventSave.toggle(eventId, nextSaved);
  }

  if (event.isPending) {
    return (
      <VisitorPageShell maxWidth="content">
        <EventPageLoading />
      </VisitorPageShell>
    );
  }

  if (event.error || !event.data) {
    return (
      <VisitorPageShell maxWidth="content">
        <div className="space-y-5">
          <BackButton onClick={() => router.push("/events")} />

          <InlineMessage variant="error">
            دریافت اطلاعات ایونت انجام نشد.
          </InlineMessage>
        </div>
      </VisitorPageShell>
    );
  }

  const data = event.data;

  return (
    <VisitorPageShell maxWidth="content">
      <div className="space-y-5">
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <BackButton onClick={() => router.push("/events")} />

          {canSave && (
            <FavoriteButton
              saved={data.isSaved}
              loading={eventSave.isPending}
              onToggle={handleSaveChange}
            />
          )}
        </div>

        <EventHero event={data} />

        <EventSummary event={data} />

        {data.description && (
          <ContentCard icon={<FiInfo />} title="درباره ایونت">
            {data.description}
          </ContentCard>
        )}

        {data.suitable && (
          <ContentCard icon={<FiUsers />} title="این ایونت مناسب چه کسانی است؟">
            {data.suitable}
          </ContentCard>
        )}

        {data.plans.length > 0 && <EventPlans plans={data.plans} />}

        {data.rule && (
          <ContentCard icon={<FiShield />} title="قوانین ایونت">
            {data.rule}
          </ContentCard>
        )}

        {data.info && (
          <ContentCard icon={<FiInfo />} title="اطلاعات تکمیلی">
            {data.info}
          </ContentCard>
        )}

        <EventLocation event={data} />

        {canComment && (
          <VisitorEventComments
            eventId={data.id}
            onEventChanged={() => event.refetch()}
          />
        )}

        {data.similarEvents.length > 0 && (
          <SimilarEvents
            events={data.similarEvents}
            canSave={canSave}
            onChanged={() => event.refetch()}
          />
        )}

        <VisitorFooter />
      </div>
    </VisitorPageShell>
  );
}

function EventHero({ event }: { event: EventData }) {
  return (
    <section className="relative">
      <ImageSlider
        images={event.images.map((image) => ({
          id: image.id,

          url: image.url,

          alt: event.eventName,
        }))}
        alt={event.eventName}
        priority
        aspectClassName="
          aspect-[4/3]
          sm:aspect-[16/8]
        "
        fallback={<FiCalendar size={52} />}
      />

      <div
        className="
          pointer-events-none
          absolute
          right-4
          top-4
          z-20
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
    </section>
  );
}

function EventSummary({ event }: { event: EventData }) {
  return (
    <section
      className="
        rounded-[30px]
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        sm:p-7
      "
    >
      <div>
        <Text
          as="h1"
          variant="heading-xl"
          className="
            leading-10
          "
        >
          {event.eventName}
        </Text>

        <div
          className="
            mt-3
            flex
            items-center
            gap-3
          "
        >
          <PlaceAvatar
            image={event.place.host.user.profileImage}
            name={event.place.host.user.fullName}
          />

          <div>
            <Text variant="label-md">{event.place.placeName}</Text>

            <Text variant="caption" tone="secondary" className="mt-0.5">
              میزبان: {event.place.host.user.fullName}
            </Text>
          </div>
        </div>
      </div>

      <div
        className="
          mt-6
          grid
          gap-3
          sm:grid-cols-3
        "
      >
        <MetaCard
          icon={<FiCalendar />}
          label="تاریخ"
          value={formatDate(event.date)}
        />

        <MetaCard
          icon={<FiClock />}
          label="ساعت"
          value={event.hour ?? "ثبت نشده"}
        />

        <MetaCard
          icon={<FiMapPin />}
          label="مکان"
          value={
            [event.place.placeProvince, event.place.placeCity]
              .filter(Boolean)
              .join("، ") || event.place.placeName
          }
        />
      </div>

      <div
        className="
          mt-5
          grid
          gap-3
          sm:grid-cols-[1fr_auto]
        "
      >
        <div
          className="
            rounded-[22px]
            bg-(--color-brand-50)
            p-4
          "
        >
          <Text variant="caption" tone="secondary">
            هزینه شرکت در ایونت
          </Text>

          <Text
            variant="heading-md"
            className="
              mt-1
              text-(--color-brand-700)
            "
          >
            {event.price
              ? `${Number(event.price).toLocaleString("fa-IR")} تومان`
              : "رایگان"}
          </Text>
        </div>

        <div
          className="
            grid
            grid-cols-2
            gap-2
            sm:min-w-[210px]
          "
        >
          <CounterCard
            icon={<FiBookmark />}
            value={event._count.savedBy}
            label="ذخیره"
          />

          <CounterCard
            icon={<FiMessageCircle />}
            value={event._count.comments}
            label="نظر"
          />
        </div>
      </div>
    </section>
  );
}

function EventPlans({ plans }: { plans: EventData["plans"] }) {
  return (
    <section
      className="
        rounded-[30px]
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        sm:p-7
      "
    >
      <div>
        <Text variant="heading-md">برنامه ایونت</Text>

        <Text tone="secondary" className="mt-1">
          زمان‌بندی برنامه‌های این رویداد
        </Text>
      </div>

      <div
        className="
          relative
          mt-6
          space-y-4
        "
      >
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className="
                relative
                flex
                items-start
                gap-4
              "
          >
            <div
              className="
                  relative
                  z-10
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-(--color-brand-500)
                  text-sm
                  font-bold
                  text-white
                  shadow-sm
                "
            >
              {index + 1}
            </div>

            <div
              className="
                  min-w-0
                  flex-1
                  rounded-[20px]
                  bg-[#f8f8f8]
                  p-4
                "
            >
              {plan.hour && (
                <div
                  className="
                      mb-2
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-white
                      px-2.5
                      py-1
                      text-xs
                      text-(--color-text-secondary)
                    "
                >
                  <FiClock />

                  {plan.hour}
                </div>
              )}

              <Text
                className="
                    whitespace-pre-wrap
                    leading-7
                  "
              >
                {plan.plan}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventLocation({ event }: { event: EventData }) {
  const location = event.place.location;

  return (
    <section
      className="
        rounded-[30px]
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        sm:p-7
      "
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-(--color-brand-50)
            text-lg
            text-(--color-brand-600)
          "
        >
          <FiMapPin />
        </div>

        <div>
          <Text variant="heading-md">محل برگزاری</Text>

          <Text variant="caption" tone="secondary" className="mt-0.5">
            {event.place.placeName}
          </Text>
        </div>
      </div>

      <div
        className="
          mt-5
          rounded-[22px]
          bg-[#f8f8f8]
          p-4
        "
      >
        <Text
          className="
            leading-7
          "
        >
          {location?.address ||
            [event.place.placeProvince, event.place.placeCity]
              .filter(Boolean)
              .join("، ") ||
            "آدرس ثبت نشده است."}
        </Text>

        {location?.title && (
          <Text variant="caption" tone="secondary" className="mt-2">
            {location.title}
          </Text>
        )}

        {location && (
          <div
            className="
              mt-4
              rounded-[18px]
              border
              border-dashed
              border-(--color-border)
              bg-white
              p-4
            "
          >
            <Text variant="caption" tone="secondary">
              مختصات
            </Text>

            <Text
              dir="ltr"
              className="
                mt-1
                text-left
              "
            >
              {location.latitude}, {location.longitude}
            </Text>

            <Text variant="caption" tone="secondary" className="mt-3">
              نقشه تعاملی را در مرحله نهایی پروژه اضافه می‌کنیم.
            </Text>
          </div>
        )}
      </div>
    </section>
  );
}

function SimilarEvents({
  events,
  canSave,
  onChanged,
}: {
  events: EventData["similarEvents"];

  canSave: boolean;

  onChanged: () => void | Promise<unknown>;
}) {
  const save = trpc.visitor.events.save.useMutation();

  const unsave = trpc.visitor.events.unsave.useMutation();

  async function handleSaveChange(eventId: string, nextSaved: boolean) {
    if (nextSaved) {
      await save.mutateAsync({
        eventId,
      });
    } else {
      await unsave.mutateAsync({
        eventId,
      });
    }

    await onChanged();
  }

  return (
    <section>
      <div>
        <Text as="h2" variant="heading-md">
          ایونت‌های مشابه
        </Text>

        <Text tone="secondary" className="mt-1">
          شاید این ایونت‌ها هم برات جذاب باشند
        </Text>
      </div>

      <div
        className="
          mt-4
          grid
          gap-4
          sm:grid-cols-2
        "
      >
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onSaveChange={canSave ? handleSaveChange : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function ContentCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;

  title: string;

  children: React.ReactNode;
}) {
  return (
    <section
      className="
        rounded-[30px]
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        sm:p-7
      "
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-(--color-brand-50)
            text-lg
            text-(--color-brand-600)
          "
        >
          {icon}
        </div>

        <Text variant="heading-md">{title}</Text>
      </div>

      <Text
        tone="secondary"
        className="
          mt-5
          whitespace-pre-wrap
          leading-8
        "
      >
        {children}
      </Text>
    </section>
  );
}

function MetaCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;

  label: string;

  value: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-[20px]
        bg-[#f8f8f8]
        p-4
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-[14px]
          bg-white
          text-(--color-brand-500)
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <Text variant="caption" tone="secondary">
          {label}
        </Text>

        <Text
          variant="label-md"
          className="
            mt-0.5
            line-clamp-2
          "
        >
          {value}
        </Text>
      </div>
    </div>
  );
}

function CounterCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;

  value: number;

  label: string;
}) {
  return (
    <div
      className="
        flex
        min-h-20
        items-center
        justify-center
        gap-2
        rounded-[20px]
        bg-[#f8f8f8]
        p-3
      "
    >
      <span
        className="
          text-(--color-brand-500)
        "
      >
        {icon}
      </span>

      <div>
        <Text variant="label-lg">{value.toLocaleString("fa-IR")}</Text>

        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      </div>
    </div>
  );
}

function PlaceAvatar({
  image,
  name,
}: {
  image: string | null;

  name: string;
}) {
  if (image) {
    return (
      <div
        className="
          relative
          h-11
          w-11
          shrink-0
          overflow-hidden
          rounded-full
        "
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="44px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-(--color-brand-50)
        font-bold
        text-(--color-brand-600)
      "
    >
      {name.trim().charAt(0) || "؟"}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="بازگشت به ایونت‌ها"
      onClick={onClick}
      className="
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        bg-white
        text-xl
        shadow-sm
        transition-colors
        hover:bg-gray-50
      "
    >
      <FiArrowRight />
    </button>
  );
}

function EventPageLoading() {
  return (
    <div
      className="
        space-y-5
      "
    >
      <div
        className="
          h-11
          w-11
          animate-pulse
          rounded-full
          bg-white
        "
      />

      <div
        className="
          aspect-4/3
          animate-pulse
          rounded-[28px]
          bg-gray-100
          sm:aspect-16/8
        "
      />

      <div
        className="
          rounded-[30px]
          bg-white
          p-5
        "
      >
        <div
          className="
            h-8
            w-2/3
            animate-pulse
            rounded-lg
            bg-gray-100
          "
        />

        <div
          className="
            mt-5
            grid
            gap-3
            sm:grid-cols-3
          "
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="
                  h-20
                  animate-pulse
                  rounded-[20px]
                  bg-gray-100
                "
            />
          ))}
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
