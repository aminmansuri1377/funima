"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";

import { FiMapPin } from "react-icons/fi";

import { Text } from "@/components/ui";

import { PLACE_TYPE_LABELS, type PlaceTypeValue } from "@/lib/place/place-type";

import { FavoriteButton } from "./favorite-button";

export type VisitorPlaceCardData = {
  id: string;

  placeName: string;

  placeType: PlaceTypeValue;

  placeProvince: string | null;

  placeCity: string | null;

  description?: string | null;

  isSaved: boolean;

  images: Array<{
    id: string;
    url: string;
    sortOrder?: number;
  }>;

  _count?: {
    comments: number;
    savedBy: number;
    events: number;
  };
};

type Props = {
  place: VisitorPlaceCardData;

  onSaveChange?: (
    placeId: string,
    nextSaved: boolean,
  ) => void | Promise<unknown>;

  compact?: boolean;

  className?: string;
};

export function PlaceCard({
  place,
  onSaveChange,
  compact = false,
  className = "",
}: Props) {
  const router = useRouter();

  const image = place.images[0]?.url ?? null;

  function openPlace() {
    router.push(`/places/${place.id}`);
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openPlace}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();

          openPlace();
        }
      }}
      className={`
        group
        cursor-pointer
        overflow-hidden
        rounded-3xl
        transition-transform
        duration-200
        hover:-translate-y-0.5

        ${className}
      `}
    >
      <div
        className={`
          relative
          overflow-hidden
          bg-gray-100

          ${compact ? "aspect-4/3" : "aspect-16/11"}
        `}
      >
        {image ? (
          <Image
            src={image}
            alt={place.placeName}
            fill
            sizes={
              compact
                ? "(max-width:768px) 50vw, 280px"
                : "(max-width:768px) 100vw, 420px"
            }
            className="
              object-cover
              transition-transform
              rounded-3xl
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
            <FiMapPin size={36} />
          </div>
        )}

        {onSaveChange && (
          <FavoriteButton
            saved={place.isSaved}
            size={compact ? "sm" : "md"}
            className="
              absolute
              left-3
              top-3
            "
            onToggle={(nextSaved) => onSaveChange(place.id, nextSaved)}
          />
        )}
      </div>

      <div className={compact ? "p-3.5" : "p-4"}>
        <div
          className="
            flex
            items-start
            justify-between
            gap-3
          "
        >
          <Text
            variant={compact ? "label-lg" : "heading-md"}
            className="line-clamp-1"
          >
            {place.placeName}
          </Text>

          <span
            className="
              shrink-0
              rounded-full
              bg-(--color-brand-50)
              px-2.5
              py-1
              text-xs
              font-medium
              text-(--color-brand-700)
            "
          >
            {PLACE_TYPE_LABELS[place.placeType]}
          </span>
        </div>

        {(place.placeCity || place.placeProvince) && (
          <div
            className="
              mt-2
              flex
              items-center
              gap-1.5
              text-sm
              text-(--color-text-secondary)
            "
          >
            <FiMapPin />

            <span className="line-clamp-1">
              {[place.placeProvince, place.placeCity]
                .filter(Boolean)
                .join("، ")}
            </span>
          </div>
        )}

        {!compact && place.description && (
          <Text
            variant="body-sm"
            tone="secondary"
            className="
                mt-3
                line-clamp-2
                leading-6
              "
          >
            {place.description}
          </Text>
        )}
      </div>
    </article>
  );
}
