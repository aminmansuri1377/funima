"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";

import { FiCalendar, FiClock, FiMapPin } from "react-icons/fi";

import { Text } from "@/components/ui";

import { FavoriteButton } from "./favorite-button";

export type VisitorEventCardData = {
  id: string;

  eventName: string;

  date: Date | string;

  hour: string | null;

  price: string | null;

  description?: string | null;

  isSaved: boolean;

  images: Array<{
    id: string;
    url: string;
    sortOrder?: number;
  }>;

  place: {
    id: string;

    placeName: string;

    placeProvince: string | null;

    placeCity: string | null;
  };

  _count?: {
    comments: number;
    savedBy: number;
    plans: number;
  };
};

type Props = {
  event: VisitorEventCardData;

  onSaveChange?: (
    eventId: string,
    nextSaved: boolean,
  ) => void | Promise<unknown>;

  className?: string;
};

export function EventCard({ event, onSaveChange, className = "" }: Props) {
  const router = useRouter();

  const image = event.images[0]?.url ?? null;

  function openEvent() {
    router.push(`/events/${event.id}`);
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openEvent}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();

          openEvent();
        }
      }}
      className={`
        group
        cursor-pointer
        overflow-hidden
        rounded-3xl
        shadow-[0_6px_24px_rgba(0,0,0,0.04)]
        transition-transform
        duration-200
        hover:-translate-y-0.5

        ${className}
      `}
    >
      <div
        className="
          relative
          aspect-16/10
          overflow-hidden
          bg-gray-100
        "
      >
        {image ? (
          <Image
            src={image}
            alt={event.eventName}
            fill
            sizes="(max-width:768px) 100vw, 480px"
            className="
              object-cover
              transition-transform
              duration-300
              rounded-3xl
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
            <FiCalendar size={38} />
          </div>
        )}

        {onSaveChange && (
          <FavoriteButton
            saved={event.isSaved}
            className="
              absolute
              left-3
              top-3
            "
            onToggle={(nextSaved) => onSaveChange(event.id, nextSaved)}
          />
        )}
      </div>

      <div className="p-4.5 sm:p-5">
        <Text variant="heading-md" className="line-clamp-2">
          {event.eventName}
        </Text>

        <Text variant="body-sm" tone="secondary" className="mt-1">
          {event.place.placeName}
        </Text>

        <div
          className="
            mt-4
            flex
            flex-wrap
            gap-2
          "
        >
          <MetaItem icon={<FiCalendar />}>{formatDate(event.date)}</MetaItem>

          {event.hour && <MetaItem icon={<FiClock />}>{event.hour}</MetaItem>}

          {(event.place.placeCity || event.place.placeProvince) && (
            <MetaItem icon={<FiMapPin />}>
              {[event.place.placeProvince, event.place.placeCity]
                .filter(Boolean)
                .join("، ")}
            </MetaItem>
          )}
        </div>

        {event.description && (
          <Text
            variant="body-sm"
            tone="secondary"
            className="
              mt-4
              line-clamp-2
              leading-6
            "
          >
            {event.description}
          </Text>
        )}
        {/* 
        <Text
          variant="label-lg"
          className="
            mt-4
            text-(--color-brand-700)
          "
        >
          {event.price
            ? `${Number(event.price).toLocaleString("fa-IR")} تومان`
            : "رایگان"}
        </Text> */}
      </div>
    </article>
  );
}

function MetaItem({
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
        px-2.5
        py-1.5
        text-xs
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
    month: "short",
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
