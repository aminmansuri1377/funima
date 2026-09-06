"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";

import type { inferRouterOutputs } from "@trpc/server";

import {
  FiArrowRight,
  FiBookmark,
  FiCalendar,
  FiClock,
  FiExternalLink,
  FiInfo,
  FiMapPin,
  FiMessageCircle,
  FiNavigation,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { useEventSave } from "@/hooks/visitor/use-event-save";

import { ImageSlider, InlineMessage, Text } from "@/components/ui";

import type { AppRouter } from "@/server/trpc/root";

import { trpc } from "@/trpc/client";

import { FavoriteButton } from "./favorite-button";
import { VisitorEventComments } from "./visitor-event-comments";
import { VisitorFooter } from "./visitor-footer";
import { VisitorPageShell } from "./visitor-page-shell";

type RouterOutputs = inferRouterOutputs<AppRouter>;

type EventData = RouterOutputs["visitor"]["events"]["getById"];

type Props = {
  eventId: string;
};

export function VisitorEventPage({ eventId }: Props) {
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
          <BackActionButton onClick={() => router.push("/events")} />

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
      <div>
        <EventHero
          event={data}
          saved={data.isSaved}
          saving={eventSave.isPending}
          onSaveChange={handleSaveChange}
          onBack={() => router.back()}
          onFallbackBack={() => router.push("/events")}
        />

        <div className="mt-7">
          <EventSummary event={data} />
        </div>

        <div className="mt-7">
          <PricePill event={data} />
        </div>

        <div className="mt-9">
          <EventInfoSection event={data} />
        </div>

        {data.description && (
          <div className="mt-9">
            <TextBlockSection
              title="درباره ایونت :"
              content={data.description}
            />
          </div>
        )}

        {data.suitable && (
          <div className="mt-9">
            <BulletSection
              title="مناسب برای :"
              icon={<FiUsers />}
              items={toBulletItems(data.suitable)}
            />
          </div>
        )}

        {data.plans.length > 0 && (
          <div className="mt-9">
            <EventPlans plans={data.plans} />
          </div>
        )}

        {data.rule && (
          <div className="mt-9">
            <BulletSection
              title="قوانین :"
              icon={<FiShield />}
              items={toBulletItems(data.rule)}
            />
          </div>
        )}

        {data.info && (
          <div className="mt-9">
            <TextBlockSection title="اطلاعات تکمیلی :" content={data.info} />
          </div>
        )}

        {data.similarEvents.length > 0 && (
          <div className="mt-10">
            <SimilarEvents
              events={data.similarEvents}
              onChanged={() => event.refetch()}
            />
          </div>
        )}

        <div className="mt-12">
          <VisitorEventComments
            eventId={data.id}
            onEventChanged={() => event.refetch()}
          />
        </div>

        <div className="mt-20">
          <VisitorFooter />
        </div>
      </div>
    </VisitorPageShell>
  );
}

function EventHero({
  event,
  saved,
  saving,
  onSaveChange,
  onBack,
  onFallbackBack,
}: {
  event: EventData;
  saved: boolean;
  saving: boolean;
  onSaveChange: (nextSaved: boolean) => void | Promise<unknown>;
  onBack: () => void;
  onFallbackBack: () => void;
}) {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[28px]
      "
    >
      <ImageSlider
        images={event.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: event.eventName,
        }))}
        alt={event.eventName}
        priority
        aspectClassName="
          aspect-[1.08/1]
          sm:aspect-[16/8]
        "
        fallback={<FiCalendar size={52} />}
      />

      <div
        className="
          absolute
          left-3
          top-3
          z-20
        "
      >
        <BackActionButton
          onClick={() => {
            try {
              onBack();
            } catch {
              onFallbackBack();
            }
          }}
        />
      </div>

      <div
        className="
          absolute
          right-3
          top-3
          z-20
        "
      >
        <FavoriteButton
          saved={saved}
          loading={saving}
          onToggle={onSaveChange}
        />
      </div>
    </section>
  );
}

function EventSummary({ event }: { event: EventData }) {
  return (
    <section className="text-center">
      <Text
        as="h1"
        className="
          text-[26px]
          font-black
          leading-[1.7]
          text-[#07111f]
          sm:text-[30px]
        "
      >
        {event.eventName}
      </Text>

      <Text
        className="
          mt-2
          text-[14px]
          text-[#5f6670]
          sm:text-[15px]
        "
      >
        برگزار کننده : {event.place.placeName}
      </Text>

      <div
        className="
          mt-6
          flex
          items-center
          justify-center
          gap-6
          text-[13px]
          text-[#6f7782]
        "
      >
        <StatItem
          icon={<FiBookmark />}
          value={event._count.savedBy.toLocaleString("fa-IR")}
          label="ذخیره"
        />

        <StatItem
          icon={<FiMessageCircle />}
          value={event._count.comments.toLocaleString("fa-IR")}
          label="نظر"
        />
      </div>
    </section>
  );
}

function PricePill({ event }: { event: EventData }) {
  return (
    <div
      className="
        mx-auto
        flex
        min-h-[48px]
        max-w-[340px]
        items-center
        justify-center
        rounded-full
        bg-white
        px-6
        text-center
        shadow-[0_1px_0_rgba(0,0,0,0.03)]
      "
    >
      <Text
        className="
          text-[15px]
          font-bold
          text-[#1d2430]
          sm:text-[16px]
        "
      >
        قیمت بلیط ها :{" "}
        {event.price
          ? `${Number(event.price).toLocaleString("fa-IR")} تومان`
          : "رایگان"}
      </Text>
    </div>
  );
}

function EventInfoSection({ event }: { event: EventData }) {
  const address =
    event.place.location?.address ||
    event.place.location?.title ||
    [event.place.placeProvince, event.place.placeCity, event.place.placeName]
      .filter(Boolean)
      .join(" - ");

  const googleMapsHref = event.place.location
    ? `https://www.google.com/maps/search/?api=1&query=${event.place.location.latitude},${event.place.location.longitude}`
    : null;

  return (
    <section>
      <SectionTitle>اطلاعات ایونت :</SectionTitle>

      <div className="mt-4 space-y-3">
        <InfoRow icon={<FiCalendar />} value={formatDate(event.date)} />

        <InfoRow
          icon={<FiClock />}
          value={event.hour ? `ساعت ${event.hour}` : "ساعت ثبت نشده"}
        />

        <InfoRow icon={<FiMapPin />} value={address || "آدرس ثبت نشده است."} />

        <InfoRow
          icon={<FiUsers />}
          value={
            event.price
              ? `قیمت بلیط : ${Number(event.price).toLocaleString(
                  "fa-IR",
                )} تومان`
              : "شرکت در ایونت رایگان است."
          }
        />
      </div>

      {googleMapsHref && (
        <a
          href={googleMapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="
            mt-4
            inline-flex
            min-h-11
            items-center
            justify-center
            gap-2
            rounded-full
            bg-white
            px-5
            text-[14px]
            font-medium
            text-[#1d2430]
            transition-colors
            hover:bg-[#f8f8f8]
          "
        >
          <FiNavigation className="text-[#ff6a3d]" />
          <span>باز کردن در Google Maps</span>
          <FiExternalLink className="text-[#9aa1ab]" />
        </a>
      )}
    </section>
  );
}

function TextBlockSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>

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
            text-[#3f4650]
          "
        >
          {content}
        </Text>
      </div>
    </section>
  );
}

function BulletSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <SectionTitle>{title}</SectionTitle>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                mt-1
                flex
                h-6
                w-6
                shrink-0
                items-center
                justify-center
                text-[16px]
                text-[#ff6a3d]
              "
            >
              {icon}
            </div>

            <Text
              className="
                text-[14px]
                leading-8
                text-[#3f4650]
              "
            >
              {item}
            </Text>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventPlans({ plans }: { plans: EventData["plans"] }) {
  return (
    <section>
      <SectionTitle>برنامه ایونت :</SectionTitle>

      <div className="mt-4 space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="
              flex
              items-center
              justify-between
              gap-3
              rounded-full
              bg-white
              px-5
              py-3
            "
          >
            <Text
              className="
                text-[14px]
                font-medium
                text-[#202734]
              "
            >
              {plan.plan}
            </Text>

            <span
              className="
                shrink-0
                rounded-full
                bg-[#f6f6f6]
                px-3
                py-1
                text-[13px]
                font-bold
                text-[#2a3140]
              "
            >
              {plan.hour || "--:--"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SimilarEvents({
  events,
  onChanged,
}: {
  events: EventData["similarEvents"];
  onChanged: () => void | Promise<unknown>;
}) {
  const save = trpc.visitor.events.save.useMutation();
  const unsave = trpc.visitor.events.unsave.useMutation();

  async function handleSaveChange(eventId: string, nextSaved: boolean) {
    if (nextSaved) {
      await save.mutateAsync({ eventId });
    } else {
      await unsave.mutateAsync({ eventId });
    }

    await onChanged();
  }

  return (
    <section>
      <SectionTitle>ایونت های مشابه :</SectionTitle>

      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-4
        "
      >
        {events.map((event) => (
          <SimilarEventCard
            key={event.id}
            event={event}
            onSaveChange={handleSaveChange}
          />
        ))}
      </div>
    </section>
  );
}

function SimilarEventCard({
  event,
  onSaveChange,
}: {
  event: EventData["similarEvents"][number];
  onSaveChange: (
    eventId: string,
    nextSaved: boolean,
  ) => void | Promise<unknown>;
}) {
  const router = useRouter();

  const image = event.images[0]?.url ?? null;

  return (
    <article className="min-w-0">
      <div
        role="link"
        tabIndex={0}
        onClick={() => router.push(`/events/${event.id}`)}
        onKeyDown={(keyboardEvent) => {
          if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
            keyboardEvent.preventDefault();
            router.push(`/events/${event.id}`);
          }
        }}
        className="
          group
          relative
          cursor-pointer
          overflow-hidden
          rounded-[24px]
          bg-white
        "
      >
        <div className="relative aspect-[0.88/1] bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={event.eventName}
              fill
              sizes="(max-width:768px) 45vw, 220px"
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
                text-[#ff6a3d]
              "
            >
              <FiCalendar size={34} />
            </div>
          )}

          <div
            className="
              absolute
              right-3
              top-3
            "
          >
            <FavoriteButton
              saved={event.isSaved}
              size="sm"
              onToggle={(nextSaved) => onSaveChange(event.id, nextSaved)}
            />
          </div>
        </div>
      </div>

      <div className="pt-3 text-center">
        <Text
          className="
            line-clamp-1
            text-[15px]
            font-bold
            text-[#111827]
          "
        >
          {event.place.placeName}
        </Text>

        <Text
          tone="secondary"
          className="
            mt-1
            line-clamp-1
            text-[13px]
          "
        >
          {[event.place.placeCity, event.place.placeProvince]
            .filter(Boolean)
            .join(" - ")}
        </Text>
      </div>
    </article>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
      "
    >
      <div
        className="
          mt-0.5
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          text-[18px]
          text-[#ff6a3d]
        "
      >
        {icon}
      </div>

      <Text
        className="
          text-[14px]
          leading-8
          text-[#3f4650]
        "
      >
        {value}
      </Text>
    </div>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div
      className="
        inline-flex
        items-center
        gap-2
      "
    >
      <span className="text-[#ff6a3d]">{icon}</span>

      <span>
        {value} {label}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      as="h2"
      className="
        text-[18px]
        font-black
        leading-8
        text-[#111827]
      "
    >
      {children}
    </Text>
  );
}

function BackActionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="بازگشت"
      onClick={onClick}
      className="
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        bg-white/95
        text-xl
        text-[#1b2230]
        shadow-sm
        backdrop-blur-sm
        transition-colors
        hover:bg-white
      "
    >
      <FiArrowRight />
    </button>
  );
}

function EventPageLoading() {
  return (
    <div>
      <div
        className="
          aspect-[1.08/1]
          animate-pulse
          rounded-[28px]
          bg-gray-200
          sm:aspect-[16/8]
        "
      />

      <div className="mt-7 flex flex-col items-center">
        <div
          className="
            h-8
            w-2/3
            animate-pulse
            rounded-lg
            bg-gray-200
          "
        />

        <div
          className="
            mt-3
            h-4
            w-40
            animate-pulse
            rounded
            bg-gray-200
          "
        />

        <div
          className="
            mt-6
            h-4
            w-32
            animate-pulse
            rounded
            bg-gray-200
          "
        />
      </div>

      <div
        className="
          mx-auto
          mt-7
          h-12
          max-w-[340px]
          animate-pulse
          rounded-full
          bg-white
        "
      />

      <div className="mt-9 space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="
              h-8
              animate-pulse
              rounded
              bg-transparent
            "
          >
            <div className="h-full w-full rounded-lg bg-gray-200" />
          </div>
        ))}
      </div>

      <div
        className="
          mt-9
          h-40
          animate-pulse
          rounded-[22px]
          bg-white
        "
      />
    </div>
  );
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function toBulletItems(value: string) {
  return value
    .split(/\n|•|●|▪|◦|،(?=\s*[-•●▪◦])/g)
    .map((item) => item.replace(/^[-•●▪◦\s]+/, "").trim())
    .filter(Boolean);
}
