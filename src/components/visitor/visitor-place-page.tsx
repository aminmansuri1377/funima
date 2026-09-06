"use client";

import Image from "next/image";

import type { inferRouterOutputs } from "@trpc/server";

import {
  FiBookmark,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCoffee,
  FiExternalLink,
  FiHeart,
  FiInstagram,
  FiMapPin,
  FiMessageCircle,
  FiMonitor,
  FiNavigation,
  FiPhone,
  FiSmile,
  FiStar,
  FiTag,
  FiUsers,
} from "react-icons/fi";

import { FaGamepad, FaGem } from "react-icons/fa";

import { LocationPreview } from "@/components/map";

import { BackButton, ImageSlider, InlineMessage, Text } from "@/components/ui";

import { useEventSave } from "@/hooks/visitor/use-event-save";
import { usePlaceSave } from "@/hooks/visitor/use-place-save";

import { PLACE_TYPE_LABELS } from "@/lib/place/place-type";

import type { AppRouter } from "@/server/trpc/root";

import { trpc } from "@/trpc/client";

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
};

type FilterGroup = {
  id: string;
  name: string;

  values: Array<{
    id: string;
    name: string;
  }>;
};

export function VisitorPlacePage({ placeId, canSave }: Props) {
  const place = trpc.visitor.places.getById.useQuery({
    placeId,
  });

  const placeSave = usePlaceSave();

  const eventSave = useEventSave();

  async function handlePlaceSave(nextSaved: boolean) {
    if (!canSave) {
      return;
    }

    await placeSave.toggle(placeId, nextSaved);
  }

  async function handleEventSave(eventId: string, nextSaved: boolean) {
    if (!canSave) {
      return;
    }

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
          <BackButton />

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
      <div>
        {/*
         * ========================================
         * HERO
         * ========================================
         */}

        <PlaceHero
          place={data}
          canSave={canSave}
          saving={placeSave.isPending}
          onSaveChange={handlePlaceSave}
        />

        {/*
         * ========================================
         * SUMMARY
         * ========================================
         */}

        <div className="mt-7">
          <PlaceSummary place={data} />
        </div>

        {/*
         * ========================================
         * ABOUT
         * ========================================
         */}

        {data.description && (
          <div className="mt-10">
            <AboutPlace description={data.description} />
          </div>
        )}

        {/*
         * ========================================
         * FILTERS
         * ========================================
         */}

        {data.filterValues.length > 0 && (
          <div className="mt-10">
            <PlaceFilters place={data} />
          </div>
        )}

        {/*
         * ========================================
         * CONTACT
         * ========================================
         */}

        {(data.placePhone || data.instagramId) && (
          <div className="mt-10">
            <PlaceContact place={data} />
          </div>
        )}

        {/*
         * ========================================
         * LOCATION
         * ========================================
         */}

        <div className="mt-10">
          <PlaceLocation place={data} />
        </div>

        {/*
         * ========================================
         * EVENTS
         * ========================================
         */}

        {data.events.length > 0 && (
          <div className="mt-12">
            <PlaceEvents
              place={data}
              onSaveChange={canSave ? handleEventSave : undefined}
            />
          </div>
        )}

        {/*
         * ========================================
         * COMMENTS
         * ========================================
         */}

        {canSave && (
          <div className="mt-12">
            <VisitorPlaceComments
              placeId={data.id}
              onPlaceChanged={() => place.refetch()}
            />
          </div>
        )}

        {/*
         * ========================================
         * FOOTER
         * ========================================
         */}

        <div className="mt-20">
          <VisitorFooter />
        </div>
      </div>
    </VisitorPageShell>
  );
}

/* =====================================================
 * HERO
 * ===================================================== */

function PlaceHero({
  place,
  canSave,
  saving,
  onSaveChange,
}: {
  place: PlaceData;

  canSave: boolean;

  saving: boolean;

  onSaveChange: (nextSaved: boolean) => void | Promise<unknown>;
}) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-[28px]
      "
    >
      <ImageSlider
        images={place.images.map((image) => ({
          id: image.id,

          url: image.url,

          alt: place.placeName,
        }))}
        alt={place.placeName}
        priority
        aspectClassName="
          aspect-[1.12/1]
          sm:aspect-[16/8]
        "
        fallback={<FiMapPin size={52} />}
      />

      <BackButton
        label="بازگشت"
        className="
          absolute
          left-3
          top-3
          z-20
          border-0
          bg-white/95
          shadow-none
          backdrop-blur-sm
        "
      />

      {canSave && (
        <div
          className="
            absolute
            right-3
            top-3
            z-20
          "
        >
          <FavoriteButton
            saved={place.isSaved}
            loading={saving}
            onToggle={onSaveChange}
          />
        </div>
      )}
    </div>
  );
}

/* =====================================================
 * SUMMARY
 * ===================================================== */

function PlaceSummary({ place }: { place: PlaceData }) {
  const locationText = [place.placeProvince, place.placeCity]
    .filter(Boolean)
    .join(" - ");

  return (
    <section
      className="
        px-1
        text-center
      "
    >
      <Text
        as="h1"
        variant="heading-xl"
        className="
          text-[26px]
          font-black
          leading-[1.5]
          text-[#07111f]
        "
      >
        {place.placeName}
      </Text>

      <div
        className="
          mt-2
          flex
          flex-wrap
          items-center
          justify-center
          gap-x-2
          gap-y-1
          text-[14px]
          text-[#7f8791]
        "
      >
        <span>{PLACE_TYPE_LABELS[place.placeType]}</span>

        {locationText && (
          <>
            <span>•</span>

            <span>{locationText}</span>
          </>
        )}
      </div>

      <div
        className="
          mt-5
          flex
          items-center
          justify-center
          gap-2
        "
      >
        <HostAvatar
          image={place.host.user.profileImage}
          name={place.host.user.fullName}
        />

        <div className="text-right">
          <Text variant="caption" tone="secondary">
            میزبان
          </Text>

          <Text variant="label-md" className="mt-0.5">
            {place.host.user.fullName}
          </Text>
        </div>
      </div>

      <div
        className="
          mx-auto
          mt-7
          flex
          max-w-[360px]
          items-center
          justify-around
          border-y
          border-black/5
          py-4
        "
      >
        <SummaryMetric
          icon={<FiBookmark />}
          value={place._count.savedBy}
          label="ذخیره"
        />

        <span
          className="
            h-8
            w-px
            bg-black/5
          "
        />

        <SummaryMetric
          icon={<FiMessageCircle />}
          value={place._count.comments}
          label="نظر"
        />

        <span
          className="
            h-8
            w-px
            bg-black/5
          "
        />

        <SummaryMetric
          icon={<FiCalendar />}
          value={place._count.events}
          label="ایونت"
        />
      </div>
    </section>
  );
}

function SummaryMetric({
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
        min-w-20
        items-center
        justify-center
        gap-2
      "
    >
      <span
        className="
          text-[17px]
          text-[#ff6437]
        "
      >
        {icon}
      </span>

      <div
        className="
          flex
          items-baseline
          gap-1
        "
      >
        <span
          className="
            text-[14px]
            font-bold
            text-[#101828]
          "
        >
          {value.toLocaleString("fa-IR")}
        </span>

        <span
          className="
            text-[12px]
            text-[#7f8791]
          "
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/* =====================================================
 * ABOUT
 * ===================================================== */

function AboutPlace({ description }: { description: string }) {
  return (
    <section>
      <SectionTitle>درباره این مکان :</SectionTitle>

      <div
        className="
          mt-3
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
          {description}
        </Text>
      </div>
    </section>
  );
}

/* =====================================================
 * FILTERS
 * ===================================================== */

function PlaceFilters({ place }: { place: PlaceData }) {
  /*
   * هر FilterValue در دیتای Place،
   * Filter والد خودش را هم دارد.
   *
   * پس آنها را بر اساس filter.id
   * گروه‌بندی می‌کنیم.
   */
  const groupedFilters = place.filterValues.reduce<FilterGroup[]>(
    (groups, item) => {
      const value = item.filterValue;

      const filter = value.filter;

      const existingGroup = groups.find((group) => group.id === filter.id);

      if (existingGroup) {
        existingGroup.values.push({
          id: value.id,
          name: value.name,
        });

        return groups;
      }

      groups.push({
        id: filter.id,

        name: filter.name,

        values: [
          {
            id: value.id,
            name: value.name,
          },
        ],
      });

      return groups;
    },
    [],
  );

  if (groupedFilters.length === 0) {
    return null;
  }

  return (
    <section
      className="
        space-y-8
      "
    >
      {groupedFilters.map((group) => (
        <div key={group.id}>
          {/*
           * نام Filter از دیتابیس
           *
           * مثال:
           * تجربه هایی که این مکان ارائه میده
           * اتمسفر
           */}

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
            {group.name}
            {group.name.trim().endsWith(":") ? "" : " :"}
          </Text>

          {/*
           * Filter Values
           */}

          <div
            className="
                mt-4
                flex
                flex-wrap
                gap-x-3
                gap-y-3
              "
          >
            {group.values.map((value) => (
              <FilterValueChip key={value.id} name={value.name} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/* =====================================================
 * FILTER VALUE CHIP
 * ===================================================== */

function FilterValueChip({ name }: { name: string }) {
  const visual = getFilterValueVisual(name);

  return (
    <div
      className="
        inline-flex
        min-h-[48px]
        items-center
        justify-center
        gap-2.5
        rounded-full
        bg-white
        px-4
        py-2.5
        text-[14px]
        font-medium
        text-[#252b33]

        sm:px-5
        sm:text-[15px]
      "
    >
      <span
        aria-hidden="true"
        className="
          flex
          shrink-0
          items-center
          justify-center
          text-[21px]
          text-[#ff6437]
        "
      >
        {visual}
      </span>

      <span className="whitespace-nowrap">{name}</span>
    </div>
  );
}

/* =====================================================
 * FILTER ICON
 * ===================================================== */

function getFilterValueVisual(valueName: string): React.ReactNode {
  const name = valueName.trim().toLowerCase().replace(/\s+/g, " ");

  /*
   * کار کردن
   */

  if (
    name.includes("کار کردن") ||
    name.includes("کارکردن") ||
    name.includes("کار با لپ") ||
    name.includes("لپ تاپ") ||
    name.includes("لپ‌تاپ")
  ) {
    return <FiMonitor />;
  }

  /*
   * قرار کاری
   */

  if (
    name.includes("قرار کاری") ||
    name.includes("جلسه کاری") ||
    name.includes("جلسه")
  ) {
    return <FiBriefcase />;
  }

  /*
   * مطالعه
   */

  if (
    name.includes("مطالعه") ||
    name.includes("کتاب") ||
    name.includes("درس")
  ) {
    return <FiBookOpen />;
  }

  /*
   * قرار عاشقانه / دو نفره
   */

  if (
    name.includes("عاشقانه") ||
    name.includes("رمانتیک") ||
    name.includes("دو نفره") ||
    name.includes("دونفره") ||
    name.includes("دیت")
  ) {
    return <FiHeart />;
  }

  /*
   * دورهمی / گروهی
   */

  if (
    name.includes("دورهم") ||
    name.includes("دوستان") ||
    name.includes("گروهی")
  ) {
    return <FiUsers />;
  }

  /*
   * گیم / سرگرمی
   */

  if (
    name.includes("گیم") ||
    name.includes("بازی") ||
    name.includes("سرگرمی")
  ) {
    return <FaGamepad />;
  }

  /*
   * لوکس
   */

  if (name.includes("لوکس") || name.includes("لاکچری")) {
    return <FaGem />;
  }

  /*
   * دنج
   */

  if (name.includes("دنج") || name.includes("گرم")) {
    return <FiCoffee />;
  }

  /*
   * آرامش بخش
   */

  if (name.includes("آرامش") || name.includes("آرام")) {
    return <FiSmile />;
  }

  /*
   * خاص / ویژه
   */

  if (name.includes("خاص") || name.includes("ویژه")) {
    return <FiStar />;
  }

  /*
   * قرار / ملاقات عمومی
   */

  if (name.includes("قرار") || name.includes("ملاقات")) {
    return <FiHeart />;
  }

  /*
   * fallback
   */

  return <FiTag />;
}

/* =====================================================
 * CONTACT
 * ===================================================== */

function PlaceContact({ place }: { place: PlaceData }) {
  if (!place.placePhone && !place.instagramId) {
    return null;
  }

  return (
    <section>
      <SectionTitle>اطلاعات تماس :</SectionTitle>

      <div
        className="
          mt-4
          space-y-4
        "
      >
        {place.placePhone && (
          <a
            href={`tel:${place.placePhone}`}
            className="
              flex
              items-center
              gap-3
              text-[14px]
              text-[#303640]
              transition-opacity
              hover:opacity-70
            "
          >
            <DetailIcon>
              <FiPhone />
            </DetailIcon>

            <div>
              <Text variant="caption" tone="secondary">
                شماره تماس
              </Text>

              <div
                dir="ltr"
                className="
                  mt-0.5
                  font-semibold
                "
              >
                {place.placePhone}
              </div>
            </div>
          </a>
        )}

        {place.instagramId && (
          <a
            href={`https://instagram.com/${normalizeInstagramId(
              place.instagramId,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex
              items-center
              gap-3
              text-[14px]
              text-[#303640]
              transition-opacity
              hover:opacity-70
            "
          >
            <DetailIcon>
              <FiInstagram />
            </DetailIcon>

            <div>
              <Text variant="caption" tone="secondary">
                اینستاگرام
              </Text>

              <div
                dir="ltr"
                className="
                  mt-0.5
                  font-semibold
                "
              >
                @{normalizeInstagramId(place.instagramId)}
              </div>
            </div>
          </a>
        )}
      </div>
    </section>
  );
}

/* =====================================================
 * LOCATION
 * ===================================================== */

function PlaceLocation({ place }: { place: PlaceData }) {
  const location = place.location;

  const fallbackAddress = [place.placeProvince, place.placeCity]
    .filter(Boolean)
    .join(" - ");

  if (!location) {
    return (
      <section>
        <SectionTitle>موقعیت مکانی :</SectionTitle>

        <div
          className="
            mt-4
            flex
            items-center
            gap-3
          "
        >
          <DetailIcon>
            <FiMapPin />
          </DetailIcon>

          <Text variant="body-sm" tone="secondary">
            موقعیت مکانی این مجموعه هنوز ثبت نشده است.
          </Text>
        </div>
      </section>
    );
  }

  const googleMapsHref =
    `https://www.google.com/maps/search/?api=1&query=` +
    `${location.latitude},${location.longitude}`;

  return (
    <section>
      <SectionTitle>موقعیت مکانی :</SectionTitle>

      <div
        className="
          mt-4
          flex
          items-start
          gap-3
        "
      >
        <DetailIcon>
          <FiMapPin />
        </DetailIcon>

        <div className="min-w-0">
          {location.title && (
            <Text
              variant="label-md"
              className="
                leading-6
              "
            >
              {location.title}
            </Text>
          )}

          <Text
            variant="body-sm"
            tone="secondary"
            className="
              mt-1
              leading-7
            "
          >
            {location.address || fallbackAddress || place.placeName}
          </Text>
        </div>
      </div>

      <div className="mt-5">
        <LocationPreview
          latitude={location.latitude}
          longitude={location.longitude}
          className="
            h-[230px]
            sm:h-[320px]
          "
          showNavigation
          showOpenInMaps={false}
        />
      </div>

      <a
        href={googleMapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="
          mt-3
          flex
          min-h-12
          w-full
          items-center
          justify-center
          gap-2
          rounded-full
          bg-white
          px-5
          text-[14px]
          font-bold
          text-[#101828]
          transition-colors
          hover:bg-[#f8f8f8]
        "
      >
        <FiNavigation
          className="
            text-[18px]
            text-[#ff6437]
          "
        />

        <span>مسیریابی با Google Maps</span>

        <FiExternalLink
          className="
            text-[15px]
            text-[#9ca3af]
          "
        />
      </a>
    </section>
  );
}

/* =====================================================
 * PLACE EVENTS
 * ===================================================== */

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
      <SectionTitle>ایونت‌های این مکان :</SectionTitle>

      <div
        className="
          mt-5
          grid
          grid-cols-1
          gap-8

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

/* =====================================================
 * COMMON
 * ===================================================== */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      as="h2"
      variant="heading-md"
      className="
        text-[17px]
        font-black
        leading-7
        text-[#111827]

        sm:text-[19px]
      "
    >
      {children}
    </Text>
  );
}

function DetailIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-white
        text-[17px]
        text-[#ff6437]
      "
    >
      {children}
    </div>
  );
}

/* =====================================================
 * HOST AVATAR
 * ===================================================== */

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
          h-9
          w-9
          shrink-0
          overflow-hidden
          rounded-full
        "
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="36px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-white
        text-sm
        font-bold
        text-[#ff6437]
      "
    >
      {name.trim().charAt(0) || "؟"}
    </div>
  );
}

/* =====================================================
 * LOADING
 * ===================================================== */

function PlacePageLoading() {
  return (
    <div>
      <div
        className="
          relative
          aspect-[1.12/1]
          animate-pulse
          rounded-[28px]
          bg-gray-200

          sm:aspect-[16/8]
        "
      />

      <div
        className="
          mt-7
          flex
          flex-col
          items-center
        "
      >
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
            w-1/3
            animate-pulse
            rounded
            bg-gray-200
          "
        />

        <div
          className="
            mt-8
            h-px
            w-full
            bg-black/5
          "
        />

        <div
          className="
            mt-4
            grid
            w-full
            grid-cols-3
            gap-4
          "
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="
                  mx-auto
                  h-5
                  w-16
                  animate-pulse
                  rounded
                  bg-gray-200
                "
            />
          ))}
        </div>

        <div
          className="
            mt-4
            h-px
            w-full
            bg-black/5
          "
        />
      </div>

      <div
        className="
          mt-10
          h-36
          animate-pulse
          rounded-[22px]
          bg-white
        "
      />

      <div
        className="
          mt-10
          space-y-6
        "
      >
        {[1, 2].map((group) => (
          <div key={group}>
            <div
              className="
                  h-5
                  w-48
                  animate-pulse
                  rounded
                  bg-gray-200
                "
            />

            <div
              className="
                  mt-4
                  flex
                  flex-wrap
                  gap-3
                "
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="
                        h-12
                        w-28
                        animate-pulse
                        rounded-full
                        bg-white
                      "
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="
          mt-10
          h-56
          animate-pulse
          rounded-[22px]
          bg-gray-200
        "
      />
    </div>
  );
}

/* =====================================================
 * HELPERS
 * ===================================================== */

function normalizeInstagramId(value: string) {
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/+$/, "");
}
