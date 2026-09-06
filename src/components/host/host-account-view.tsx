"use client";

import { useState } from "react";

import {
  FiBookOpen,
  FiBriefcase,
  FiCoffee,
  FiEdit2,
  FiHeart,
  FiInstagram,
  FiMapPin,
  FiMonitor,
  FiPhone,
  FiSmile,
  FiStar,
  FiTag,
  FiUsers,
  FiZap,
} from "react-icons/fi";

import { FaGamepad, FaGem } from "react-icons/fa";

import { LocationPreview } from "@/components/map";

import { ImageSlider, Text } from "@/components/ui";

import { PLACE_TYPE_LABELS, type PlaceTypeValue } from "@/lib/place/place-type";

import { HostPlaceEdit } from "./host-place-edit";

export type HostPlaceData = {
  id: string;

  placeName: string;

  placePhone: string | null;

  placeType: PlaceTypeValue;

  placeProvince: string | null;

  placeCity: string | null;

  instagramId: string | null;

  description: string | null;

  location: {
    id: string;
    title: string | null;
    address: string | null;
    latitude: number;
    longitude: number;
  } | null;

  images: Array<{
    id: string;
    url: string;
    sortOrder: number;
  }>;

  filterValues: Array<{
    filterValue: {
      id: string;
      name: string;

      filter: {
        id: string;
        name: string;
      };
    };
  }>;

  _count: {
    events: number;
    comments: number;
    savedBy: number;
  };
};

type Props = {
  place: HostPlaceData;

  onChanged: () => void | Promise<unknown>;
};

export function HostAccountView({ place, onChanged }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <HostPlaceEdit
        place={place}
        onCancel={() => setEditing(false)}
        onChanged={onChanged}
        onSaved={async () => {
          await onChanged();

          setEditing(false);
        }}
      />
    );
  }

  const groupedFilters = groupFilters(place.filterValues);

  const locationText = [place.placeProvince, place.placeCity]
    .filter(Boolean)
    .join(" - ");

  return (
    <div>
      {/*
       * ========================================
       * IMAGE
       * ========================================
       */}

      <ImageSlider
        images={place.images.map((image) => ({
          id: image.id,

          url: image.url,

          alt: place.placeName,
        }))}
        alt={place.placeName}
        priority
        aspectClassName="
          aspect-[1.05/1]
          sm:aspect-[16/9]
        "
        fallback={<FiMapPin size={46} />}
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
          onClick={() => setEditing(true)}
          className="
            inline-flex
            min-h-11
            min-w-[170px]
            items-center
            justify-center
            gap-2
            rounded-full
            border
            border-[#ff6437]
            bg-transparent
            px-6
            text-[14px]
            font-semibold
            text-[#ff6437]
            transition-colors

            hover:bg-[#fff4ef]
          "
        >
          <FiEdit2 />
          ویرایش مکان
        </button>
      </div>

      {/*
       * ========================================
       * TITLE
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
            leading-9
            text-[#07111f]

            sm:text-[29px]
          "
        >
          {place.placeName}
        </Text>

        <div
          className="
            mt-3
            flex
            flex-wrap
            items-center
            justify-center
            gap-x-2
            gap-y-1
            text-[13px]
            text-[#707781]
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
      </section>

      {/*
       * ========================================
       * PLACE INFORMATION
       * ========================================
       */}

      <section className="mt-10">
        <SectionTitle>اطلاعات مکان :</SectionTitle>

        <div
          className="
            mt-4
            space-y-4
          "
        >
          <InformationRow icon={<FiMapPin />}>
            {place.location?.address || locationText || "آدرس ثبت نشده است."}
          </InformationRow>

          <InformationRow icon={<FiTag />}>
            {PLACE_TYPE_LABELS[place.placeType]}
          </InformationRow>

          {place.placePhone && (
            <InformationRow icon={<FiPhone />} dir="ltr">
              {place.placePhone}
            </InformationRow>
          )}

          {place.instagramId && (
            <InformationRow icon={<FiInstagram />} dir="ltr">
              {formatInstagram(place.instagramId)}
            </InformationRow>
          )}
        </div>
      </section>

      {/*
       * ========================================
       * FILTER GROUPS
       * ========================================
       */}

      {groupedFilters.length > 0 && (
        <section
          className="
            mt-10
            space-y-8
          "
        >
          {groupedFilters.map((group) => (
            <div key={group.id}>
              <SectionTitle>
                {group.name}
                {group.name.trim().endsWith(":") ? "" : " :"}
              </SectionTitle>

              <div
                className="
                    mt-4
                    flex
                    flex-wrap
                    gap-3
                  "
              >
                {group.values.map((value) => (
                  <FilterChip key={value.id} name={value.name} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/*
       * ========================================
       * ABOUT
       * ========================================
       */}

      {place.description && (
        <section className="mt-10">
          <SectionTitle>چرا {place.placeName} !</SectionTitle>

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
              {place.description}
            </Text>
          </div>
        </section>
      )}

      {/*
       * ========================================
       * MAP
       * ========================================
       */}

      <section className="mt-10">
        <SectionTitle>لوکیشن دقیق :</SectionTitle>

        {place.location ? (
          <div className="mt-4">
            <LocationPreview
              latitude={place.location.latitude}
              longitude={place.location.longitude}
              className="
                h-[230px]
                sm:h-[310px]
              "
              showNavigation
              showOpenInMaps={false}
            />
          </div>
        ) : (
          <div
            className="
              mt-4
              flex
              min-h-36
              items-center
              justify-center
              rounded-[22px]
              border
              border-dashed
              border-[#cfcfcf]
              px-4
              text-center
            "
          >
            <Text variant="body-sm" tone="secondary">
              موقعیت مکانی هنوز ثبت نشده است.
            </Text>
          </div>
        )}
      </section>
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
  dir,
}: {
  icon: React.ReactNode;

  children: React.ReactNode;

  dir?: "rtl" | "ltr";
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
        dir={dir}
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
 * FILTER CHIP
 * ===================================================== */

function FilterChip({ name }: { name: string }) {
  return (
    <div
      className="
        inline-flex
        min-h-[46px]
        items-center
        justify-center
        gap-2.5
        rounded-full
        bg-white
        px-4
        py-2
        text-[14px]
        font-medium
        text-[#242b35]
      "
    >
      <span
        className="
          flex
          shrink-0
          items-center
          justify-center
          text-[20px]
          text-[#ff6437]
        "
      >
        {getFilterIcon(name)}
      </span>

      <span className="whitespace-nowrap">{name}</span>
    </div>
  );
}

/* =====================================================
 * FILTER ICONS
 * ===================================================== */

function getFilterIcon(value: string): React.ReactNode {
  const name = value.trim().toLowerCase().replace(/\s+/g, " ");

  if (
    name.includes("کار کردن") ||
    name.includes("کارکردن") ||
    name.includes("لپ تاپ") ||
    name.includes("لپ‌تاپ")
  ) {
    return <FiMonitor />;
  }

  if (name.includes("قرار کاری") || name.includes("جلسه")) {
    return <FiBriefcase />;
  }

  if (
    name.includes("مطالعه") ||
    name.includes("کتاب") ||
    name.includes("درس")
  ) {
    return <FiBookOpen />;
  }

  if (
    name.includes("عاشقانه") ||
    name.includes("رمانتیک") ||
    name.includes("دیت") ||
    name.includes("دو نفره") ||
    name.includes("دونفره")
  ) {
    return <FiHeart />;
  }

  if (
    name.includes("دورهم") ||
    name.includes("دوستان") ||
    name.includes("گروهی")
  ) {
    return <FiUsers />;
  }

  if (
    name.includes("گیم") ||
    name.includes("بازی") ||
    name.includes("سرگرمی")
  ) {
    return <FaGamepad />;
  }

  if (name.includes("لوکس") || name.includes("لاکچری")) {
    return <FaGem />;
  }

  if (name.includes("دنج") || name.includes("گرم")) {
    return <FiCoffee />;
  }

  if (name.includes("آرامش") || name.includes("آرام")) {
    return <FiSmile />;
  }

  if (name.includes("ویژه") || name.includes("خاص")) {
    return <FiStar />;
  }

  if (name.includes("برق") || name.includes("شارژ")) {
    return <FiZap />;
  }

  return <FiTag />;
}

/* =====================================================
 * FILTER GROUPING
 * ===================================================== */

function groupFilters(values: HostPlaceData["filterValues"]) {
  const map = new Map<
    string,
    {
      id: string;
      name: string;

      values: Array<{
        id: string;
        name: string;
      }>;
    }
  >();

  for (const item of values) {
    const filter = item.filterValue.filter;

    const existing = map.get(filter.id);

    if (existing) {
      existing.values.push({
        id: item.filterValue.id,
        name: item.filterValue.name,
      });

      continue;
    }

    map.set(filter.id, {
      id: filter.id,

      name: filter.name,

      values: [
        {
          id: item.filterValue.id,
          name: item.filterValue.name,
        },
      ],
    });
  }

  return Array.from(map.values());
}

/* =====================================================
 * HELPERS
 * ===================================================== */

function formatInstagram(value: string) {
  const normalized = value.trim().replace(/^@/, "");

  return `@${normalized}`;
}
