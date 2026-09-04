"use client";

import Image from "next/image";

import { useState } from "react";

import {
  FiBookmark,
  FiCalendar,
  FiEdit2,
  FiInstagram,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
} from "react-icons/fi";

import { Button, Text } from "@/components/ui";

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

  return (
    <div className="space-y-4 sm:space-y-5">
      <section
        className="
          flex
          items-center
          justify-between
          gap-4
          px-1
          py-1
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            حساب شما
          </Text>

          <Text tone="secondary" className="mt-1">
            اطلاعات و وضعیت کسب‌وکار
          </Text>
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          startIcon={<FiEdit2 />}
          onClick={() => setEditing(true)}
        >
          ویرایش
        </Button>
      </section>

      <PlaceGallery placeName={place.placeName} images={place.images} />

      <section
        className="
          overflow-hidden
          rounded-[28px]
          bg-white
          shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        "
      >
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
              <Text as="h2" variant="heading-xl" className="leading-10">
                {place.placeName}
              </Text>

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <Pill>{PLACE_TYPE_LABELS[place.placeType]}</Pill>

                {(place.placeProvince || place.placeCity) && (
                  <Pill icon={<FiMapPin />}>
                    {[place.placeProvince, place.placeCity]
                      .filter(Boolean)
                      .join("، ")}
                  </Pill>
                )}
              </div>
            </div>

            <div
              className="
                grid
                grid-cols-3
                gap-2
                lg:min-w-[310px]
              "
            >
              <Stat
                icon={<FiCalendar />}
                value={place._count.events}
                label="ایونت"
              />

              <Stat
                icon={<FiMessageCircle />}
                value={place._count.comments}
                label="نظر"
              />

              <Stat
                icon={<FiBookmark />}
                value={place._count.savedBy}
                label="ذخیره"
              />
            </div>
          </div>

          {place.description && (
            <div
              className="
                mt-7
                border-t
                border-(--color-border)
                pt-6
              "
            >
              <Text variant="heading-md">درباره مجموعه</Text>

              <Text
                tone="secondary"
                className="
                  mt-3
                  whitespace-pre-wrap
                  leading-8
                "
              >
                {place.description}
              </Text>
            </div>
          )}
        </div>
      </section>

      <section
        className="
          grid
          gap-3
          sm:grid-cols-2
        "
      >
        <InfoCard
          icon={<FiPhone />}
          label="شماره تماس"
          dir="ltr"
          value={place.placePhone ?? "ثبت نشده"}
        />

        <InfoCard
          icon={<FiInstagram />}
          label="اینستاگرام"
          dir="ltr"
          value={place.instagramId ?? "ثبت نشده"}
        />
      </section>

      <section
        className="
          rounded-[28px]
          bg-white
          p-5
          shadow-[0_8px_30px_rgba(0,0,0,0.04)]
          sm:p-7
        "
      >
        <SectionHeader
          icon={<FiMapPin />}
          title="آدرس مکان"
          description={place.location?.title ?? undefined}
        />

        <div
          className="
            mt-5
            rounded-[22px]
            bg-[#f8f8f8]
            p-4
            sm:p-5
          "
        >
          <Text className="leading-7">
            {place.location?.address || "آدرسی ثبت نشده است."}
          </Text>

          {place.location && (
            <Text
              variant="caption"
              tone="secondary"
              dir="ltr"
              className="mt-3 text-left"
            >
              {place.location.latitude} , {place.location.longitude}
            </Text>
          )}
        </div>
      </section>

      {groupedFilters.length > 0 && (
        <section
          className="
            rounded-[28px]
            bg-white
            p-5
            shadow-[0_8px_30px_rgba(0,0,0,0.04)]
            sm:p-7
          "
        >
          <Text variant="heading-md">امکانات و ویژگی‌ها</Text>

          <Text tone="secondary" className="mt-1">
            ویژگی‌هایی که برای این مکان ثبت کرده‌اید
          </Text>

          <div className="mt-7 space-y-7">
            {groupedFilters.map((group) => (
              <div key={group.id}>
                <Text variant="label-lg">{group.name}</Text>

                <div className="mt-3 flex flex-wrap gap-2">
                  {group.values.map((value) => (
                    <Pill key={value.id}>{value.name}</Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Button
        type="button"
        size="xl"
        fullWidth
        variant="secondary"
        startIcon={<FiEdit2 />}
        onClick={() => setEditing(true)}
      >
        ویرایش اطلاعات کسب‌وکار
      </Button>
    </div>
  );
}

function PlaceGallery({
  placeName,
  images,
}: {
  placeName: string;
  images: HostPlaceData["images"];
}) {
  if (images.length === 0) {
    return (
      <div
        className="
          flex
          aspect-video
          items-center
          justify-center
          rounded-[28px]
          bg-(--color-brand-50)
          text-(--color-brand-500)
        "
      >
        <FiMapPin size={42} />
      </div>
    );
  }

  const mainImage = images[0];

  return (
    <section
      className="
        overflow-hidden
        rounded-[30px]
        bg-white
        p-2
        shadow-[0_8px_30px_rgba(0,0,0,0.05)]
      "
    >
      <div
        className="
          relative
          aspect-4/3
          overflow-hidden
          rounded-3xl
          sm:aspect-16/8
        "
      >
        <Image
          src={mainImage.url}
          alt={placeName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1100px"
          className="object-cover"
        />

        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            h-28
            bg-linear-to-t
            from-black/35
            to-transparent
          "
        />
      </div>

      {images.length > 1 && (
        <div
          className="
            mt-2
            grid
            grid-cols-4
            gap-2
          "
        >
          {images.slice(1, 5).map((image, index) => (
            <div
              key={image.id}
              className="
                relative
                aspect-square
                overflow-hidden
                rounded-[18px]
              "
            >
              <Image
                src={image.url}
                alt={`${placeName} - تصویر ${index + 2}`}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Pill({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-(--color-brand-50)
        px-3.5
        py-2
        text-sm
        font-medium
        text-(--color-brand-700)
      "
    >
      {icon}

      {children}
    </span>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        flex
        min-h-24
        flex-col
        items-center
        justify-center
        rounded-[20px]
        bg-[#f8f8f8]
        p-3
        text-center
      "
    >
      <span className="mb-1 text-(--color-brand-500)">{icon}</span>

      <Text variant="heading-md">{value.toLocaleString("fa-IR")}</Text>

      <Text variant="caption" tone="secondary" className="mt-0.5">
        {label}
      </Text>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  dir,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div
      className="
        flex
        min-h-24
        items-center
        gap-4
        rounded-3xl
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
      "
    >
      <div
        className="
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center
          rounded-2xl
          bg-(--color-brand-50)
          text-xl
          text-(--color-brand-600)
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <Text variant="caption" tone="secondary">
          {label}
        </Text>

        <Text variant="label-lg" className="mt-1 truncate" dir={dir}>
          {value}
        </Text>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3">
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

      <div>
        <Text variant="heading-md">{title}</Text>

        {description && (
          <Text tone="secondary" variant="caption" className="mt-0.5">
            {description}
          </Text>
        )}
      </div>
    </div>
  );
}

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
