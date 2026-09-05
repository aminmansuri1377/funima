"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";

import type { inferRouterOutputs } from "@trpc/server";
import { LocationPreview } from "@/components/map";
import {
  FiArrowRight,
  FiBookmark,
  FiCalendar,
  FiInstagram,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiTag,
} from "react-icons/fi";

import { ImageSlider, InlineMessage, Text } from "@/components/ui";

import { PLACE_TYPE_LABELS } from "@/lib/place/place-type";

import type { AppRouter } from "@/server/trpc/root";

import { trpc } from "@/trpc/client";

import { usePlaceSave } from "@/hooks/visitor/use-place-save";

import { useEventSave } from "@/hooks/visitor/use-event-save";

import { EventCard } from "./event-card";

import { FavoriteButton } from "./favorite-button";

import { VisitorFooter } from "./visitor-footer";

import { VisitorPageShell } from "./visitor-page-shell";

import { VisitorPlaceComments } from "./visitor-place-comments";

type RouterOutputs = inferRouterOutputs<AppRouter>;

type PlaceData = RouterOutputs["visitor"]["places"]["getById"];

type Props = {
  placeId: string;

  canSave: boolean;

  canComment: boolean;
};

export function VisitorPlacePage({ placeId, canSave, canComment }: Props) {
  const router = useRouter();

  const place = trpc.visitor.places.getById.useQuery({
    placeId,
  });

  const placeSave = usePlaceSave();

  const eventSave = useEventSave();

  async function handlePlaceSave(nextSaved: boolean) {
    await placeSave.toggle(placeId, nextSaved);
  }

  async function handleEventSave(eventId: string, nextSaved: boolean) {
    await eventSave.toggle(eventId, nextSaved);
  }

  if (place.isPending) {
    return (
      <VisitorPageShell maxWidth="content">
        <PlacePageLoading />
      </VisitorPageShell>
    );
  }

  if (place.error || !place.data) {
    return (
      <VisitorPageShell maxWidth="content">
        <div className="space-y-5">
          <BackButton onClick={() => router.push("/")} />

          <InlineMessage variant="error">
            دریافت اطلاعات مکان انجام نشد.
          </InlineMessage>
        </div>
      </VisitorPageShell>
    );
  }

  const data = place.data;

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
          <BackButton onClick={() => router.push("/")} />

          {canSave && (
            <FavoriteButton
              saved={data.isSaved}
              loading={placeSave.isPending}
              onToggle={handlePlaceSave}
            />
          )}
        </div>

        <PlaceHero place={data} />

        <PlaceSummary place={data} />

        <PlaceFilters place={data} />

        {data.description && <AboutPlace description={data.description} />}

        <PlaceContact place={data} />

        <PlaceLocation place={data} />

        {data.events.length > 0 && (
          <PlaceEvents
            place={data}
            onSaveChange={canSave ? handleEventSave : undefined}
          />
        )}

        {canComment && (
          <VisitorPlaceComments
            placeId={data.id}
            onPlaceChanged={() => place.refetch()}
          />
        )}

        <VisitorFooter />
      </div>
    </VisitorPageShell>
  );
}

function PlaceHero({ place }: { place: PlaceData }) {
  return (
    <ImageSlider
      images={place.images.map((image) => ({
        id: image.id,

        url: image.url,

        alt: place.placeName,
      }))}
      alt={place.placeName}
      priority
      aspectClassName="
        aspect-[4/3]
        sm:aspect-[16/8]
      "
      fallback={<FiMapPin size={52} />}
    />
  );
}

function PlaceSummary({ place }: { place: PlaceData }) {
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
          flex-col
          gap-4
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            {place.placeName}
          </Text>

          <div
            className="
              mt-2
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <span
              className="
                rounded-full
                bg-(--color-brand-50)
                px-3
                py-1.5
                text-sm
                font-semibold
                text-(--color-brand-700)
              "
            >
              {PLACE_TYPE_LABELS[place.placeType]}
            </span>

            {(place.placeProvince || place.placeCity) && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  text-sm
                  text-(--color-text-secondary)
                "
              >
                <FiMapPin />

                {[place.placeProvince, place.placeCity]
                  .filter(Boolean)
                  .join("، ")}
              </span>
            )}
          </div>
        </div>

        <div
          className="
            grid
            grid-cols-3
            gap-2
            sm:min-w-[280px]
          "
        >
          <CountCard
            icon={<FiBookmark />}
            value={place._count.savedBy}
            label="ذخیره"
          />

          <CountCard
            icon={<FiMessageCircle />}
            value={place._count.comments}
            label="نظر"
          />

          <CountCard
            icon={<FiCalendar />}
            value={place._count.events}
            label="ایونت"
          />
        </div>
      </div>

      <div
        className="
          mt-6
          flex
          items-center
          gap-3
          rounded-[22px]
          bg-[#f8f8f8]
          p-4
        "
      >
        <HostAvatar
          image={place.host.user.profileImage}
          name={place.host.user.fullName}
        />

        <div>
          <Text variant="caption" tone="secondary">
            میزبان مجموعه
          </Text>

          <Text variant="label-md" className="mt-0.5">
            {place.host.user.fullName}
          </Text>
        </div>
      </div>
    </section>
  );
}

function PlaceFilters({ place }: { place: PlaceData }) {
  const values = place.filterValues.map((item) => item.filterValue);

  if (values.length === 0) {
    return null;
  }

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
            items-center
            justify-center
            rounded-2xl
            bg-(--color-brand-50)
            text-(--color-brand-600)
          "
        >
          <FiTag />
        </div>

        <Text variant="heading-md">امکانات و ویژگی‌ها</Text>
      </div>

      <div
        className="
          mt-5
          flex
          flex-wrap
          gap-2
        "
      >
        {values.map((value) => (
          <span
            key={value.id}
            className="
                rounded-full
                border
                border-(--color-border)
                bg-[#fafafa]
                px-3.5
                py-2
                text-sm
              "
          >
            {value.name}
          </span>
        ))}
      </div>
    </section>
  );
}

function AboutPlace({ description }: { description: string }) {
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
      <Text variant="heading-md">درباره این مکان</Text>

      <Text
        tone="secondary"
        className="
          mt-4
          whitespace-pre-wrap
          leading-8
        "
      >
        {description}
      </Text>
    </section>
  );
}

function PlaceContact({ place }: { place: PlaceData }) {
  if (!place.placePhone && !place.instagramId) {
    return null;
  }

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
      <Text variant="heading-md">راه‌های ارتباطی</Text>

      <div
        className="
          mt-5
          grid
          gap-3
          sm:grid-cols-2
        "
      >
        {place.placePhone && (
          <a
            href={`tel:${place.placePhone}`}
            className="
              flex
              items-center
              gap-3
              rounded-[20px]
              bg-[#f8f8f8]
              p-4
              transition-colors
              hover:bg-(--color-brand-50)
            "
          >
            <ContactIcon>
              <FiPhone />
            </ContactIcon>

            <div>
              <Text variant="caption" tone="secondary">
                شماره تماس
              </Text>

              <Text
                dir="ltr"
                variant="label-md"
                className="
                  mt-0.5
                  text-right
                "
              >
                {place.placePhone}
              </Text>
            </div>
          </a>
        )}

        {place.instagramId && (
          <a
            href={`https://instagram.com/${normalizeInstagramId(
              place.instagramId,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="
              flex
              items-center
              gap-3
              rounded-[20px]
              bg-[#f8f8f8]
              p-4
              transition-colors
              hover:bg-(--color-brand-50)
            "
          >
            <ContactIcon>
              <FiInstagram />
            </ContactIcon>

            <div>
              <Text variant="caption" tone="secondary">
                اینستاگرام
              </Text>

              <Text
                dir="ltr"
                variant="label-md"
                className="
                  mt-0.5
                  text-right
                "
              >
                @{normalizeInstagramId(place.instagramId)}
              </Text>
            </div>
          </a>
        )}
      </div>
    </section>
  );
}

function PlaceLocation({ place }: { place: PlaceData }) {
  const location = place.location;

  if (!location) {
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
          <ContactIcon>
            <FiMapPin />
          </ContactIcon>

          <div>
            <Text variant="heading-md">موقعیت مکانی</Text>

            <Text variant="caption" tone="secondary" className="mt-0.5">
              {place.placeName}
            </Text>
          </div>
        </div>

        <div
          className="
            mt-5
            flex
            min-h-32
            items-center
            justify-center
            rounded-[22px]
            border
            border-dashed
            border-(--color-border)
            bg-[#f8f8f8]
            px-5
            text-center
          "
        >
          <Text variant="body-sm" tone="secondary">
            موقعیت مکانی این مجموعه هنوز ثبت نشده است.
          </Text>
        </div>
      </section>
    );
  }

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
          items-start
          gap-3
        "
      >
        <ContactIcon>
          <FiMapPin />
        </ContactIcon>

        <div className="min-w-0">
          <Text variant="heading-md">موقعیت مکانی</Text>

          <Text variant="caption" tone="secondary" className="mt-0.5">
            {place.placeName}
          </Text>
        </div>
      </div>

      {(location.address || location.title) && (
        <div
          className="
            mt-5
            rounded-[20px]
            bg-[#f8f8f8]
            p-4
          "
        >
          {location.title && <Text variant="label-md">{location.title}</Text>}

          {location.address && (
            <Text
              tone="secondary"
              className="
                mt-1
                leading-7
              "
            >
              {location.address}
            </Text>
          )}
        </div>
      )}

      <div className="mt-4">
        <LocationPreview
          latitude={location.latitude}
          longitude={location.longitude}
          className="
            h-[220px]
            sm:h-[300px]
          "
          showNavigation
        />
      </div>
    </section>
  );
}

function PlaceEvents({
  place,
  onSaveChange,
}: {
  place: PlaceData;

  onSaveChange?:
    | ((eventId: string, nextSaved: boolean) => void | Promise<unknown>)
    | undefined;
}) {
  const events = place.events.map((event) => ({
    ...event,

    place: {
      id: place.id,

      placeName: place.placeName,

      placeProvince: place.placeProvince,

      placeCity: place.placeCity,
    },
  }));

  return (
    <section>
      <div>
        <Text as="h2" variant="heading-md">
          ایونت‌های این مکان
        </Text>

        <Text tone="secondary" className="mt-1">
          رویدادهای آینده‌ی این مجموعه
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
          <EventCard key={event.id} event={event} onSaveChange={onSaveChange} />
        ))}
      </div>
    </section>
  );
}

function CountCard({
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
        flex-col
        items-center
        justify-center
        rounded-[18px]
        bg-[#f8f8f8]
        p-2
        text-center
      "
    >
      <span
        className="
          text-(--color-brand-500)
        "
      >
        {icon}
      </span>

      <Text variant="label-lg" className="mt-1">
        {value.toLocaleString("fa-IR")}
      </Text>

      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </div>
  );
}

function ContactIcon({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

function HostAvatar({
  name,
  image,
}: {
  name: string;

  image: string | null;
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
      aria-label="بازگشت"
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

function PlacePageLoading() {
  return (
    <div className="space-y-5">
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
            w-1/2
            animate-pulse
            rounded-lg
            bg-gray-100
          "
        />

        <div
          className="
            mt-5
            grid
            grid-cols-3
            gap-2
          "
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="
                  h-20
                  animate-pulse
                  rounded-[18px]
                  bg-gray-100
                "
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeInstagramId(value: string) {
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/+$/, "");
}
