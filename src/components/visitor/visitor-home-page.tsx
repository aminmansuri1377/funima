"use client";

import Image from "next/image";

import { useMemo, useState } from "react";

import { FiMapPin, FiSearch } from "react-icons/fi";
import type { inferRouterOutputs } from "@trpc/server";
import { usePlaceSave } from "@/hooks/visitor/use-place-save";
import type { AppRouter } from "@/server/trpc/root";
import {
  InlineMessage,
  SearchInput,
  SearchSelect,
  Text,
} from "@/components/ui";

import {
  PLACE_TYPE_OPTIONS,
  type PlaceTypeValue,
} from "@/lib/place/place-type";

import { trpc } from "@/trpc/client";

import { PlaceCard } from "./place-card";

import { PlaceCardSlider } from "./place-card-slider";

import { VisitorFooter } from "./visitor-footer";

import { VisitorPageShell } from "./visitor-page-shell";
type RouterOutputs = inferRouterOutputs<AppRouter>;

type HomeSectionsData = RouterOutputs["visitor"]["home"]["getSections"];

type SearchResultsData = RouterOutputs["visitor"]["places"]["list"];
export function VisitorHomePage() {
  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [city, setCity] = useState("");

  const [placeType, setPlaceType] = useState<PlaceTypeValue | "">("");

  const [saveError, setSaveError] = useState<string | null>(null);

  /*
   * صفحه عادی Home:
   * Sectionهایی که Admin ساخته.
   */
  const sections = trpc.visitor.home.getSections.useQuery();

  /*
   * فقط شهرهایی که واقعاً Place دارند.
   */
  const cities = trpc.visitor.home.getCities.useQuery();

  /*
   * وقتی Search / City / Type فعال باشد
   * از Search backend استفاده می‌کنیم.
   */
  const hasActiveSearch = Boolean(debouncedSearch.trim() || city || placeType);

  const searchResults = trpc.visitor.places.list.useQuery(
    {
      page: 1,

      pageSize: 24,

      search: debouncedSearch.trim() || undefined,

      city: city || undefined,

      placeType: placeType || undefined,
    },
    {
      enabled: hasActiveSearch,
    },
  );

  const placeSave = usePlaceSave();
  const cityOptions = useMemo(() => {
    const data = cities.data ?? [];

    return data.map((item) => ({
      value: item.city,

      label: item.province ? `${item.city}، ${item.province}` : item.city,
    }));
  }, [cities.data]);

  async function handleSaveChange(placeId: string, nextSaved: boolean) {
    setSaveError(null);

    try {
      await placeSave.toggle(placeId, nextSaved);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "تغییر وضعیت ذخیره انجام نشد.",
      );

      throw error;
    }
  }

  return (
    <VisitorPageShell maxWidth="wide">
      <div className="space-y-8">
        <HomeHeader />

        <section
          className="
            rounded-[28px]
            bg-white
            p-4
            shadow-[0_8px_30px_rgba(0,0,0,0.035)]
            sm:p-5
          "
        >
          <div
            className="
              grid
              gap-3
              md:grid-cols-[1fr_280px]
            "
          >
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onDebouncedChange={(value) => setDebouncedSearch(value)}
              onClear={() => {
                setSearch("");

                setDebouncedSearch("");
              }}
              placeholder="دنبال کجا می‌گردی؟"
            />

            <SearchSelect
              value={city}
              options={cityOptions}
              onChange={setCity}
              placeholder="انتخاب شهر"
              searchPlaceholder="جستجوی شهر..."
              emptyMessage="شهری پیدا نشد."
              disabled={cities.isPending}
              clearable
            />
          </div>

          <PlaceTypeFilters value={placeType} onChange={setPlaceType} />
        </section>

        {saveError && (
          <InlineMessage variant="error">{saveError}</InlineMessage>
        )}

        {hasActiveSearch ? (
          <SearchResults
            query={debouncedSearch}
            city={city}
            placeType={placeType}
            data={searchResults.data}
            pending={searchResults.isPending}
            error={Boolean(searchResults.error)}
            onSaveChange={handleSaveChange}
          />
        ) : (
          <HomeSections
            data={sections.data}
            pending={sections.isPending}
            error={Boolean(sections.error)}
            onSaveChange={handleSaveChange}
          />
        )}

        <VisitorFooter />
      </div>
    </VisitorPageShell>
  );
}

function HomeHeader() {
  return (
    <header
      className="
        flex
        items-center
        justify-between
        gap-4
        pt-1
      "
    >
      <div>
        <Text as="h1" variant="heading-xl">
          کجا بریم؟
        </Text>

        <Text tone="secondary" className="mt-1">
          بهترین مکان‌های اطرافت رو پیدا کن
        </Text>
      </div>

      <div
        className="
          relative
          h-14
          w-14
          shrink-0
        "
      >
        <Image
          src="/images/logo.png"
          alt="فونیما"
          fill
          priority
          sizes="56px"
          className="object-contain"
        />
      </div>
    </header>
  );
}

function PlaceTypeFilters({
  value,
  onChange,
}: {
  value: PlaceTypeValue | "";

  onChange: (value: PlaceTypeValue | "") => void;
}) {
  return (
    <div
      className="
        -mx-1
        mt-4
        flex
        gap-2
        overflow-x-auto
        px-1
        pb-1
        scrollbar-none
        [&::-webkit-scrollbar]:hidden
      "
    >
      <FilterChip active={value === ""} onClick={() => onChange("")}>
        همه
      </FilterChip>

      {PLACE_TYPE_OPTIONS.map((option) => (
        <FilterChip
          key={option.value}
          active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </FilterChip>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;

  children: React.ReactNode;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`
        shrink-0
        rounded-full
        border
        px-4
        py-2.5
        text-sm
        font-semibold
        transition-colors

        ${
          active
            ? `
              border-(--color-brand-500)
              bg-(--color-brand-500)
              text-white
            `
            : `
              border-(--color-border)
              bg-white
              text-(--color-text-secondary)
              hover:border-(--color-brand-300)
              hover:text-(--color-brand-600)
            `
        }
      `}
    >
      {children}
    </button>
  );
}

function HomeSections({
  data,
  pending,
  error,
  onSaveChange,
}: {
  data: HomeSectionsData | undefined;

  pending: boolean;

  error: boolean;

  onSaveChange: (
    placeId: string,
    nextSaved: boolean,
  ) => void | Promise<unknown>;
}) {
  if (pending) {
    return <HomeSectionsLoading />;
  }

  if (error) {
    return (
      <InlineMessage variant="error">
        دریافت پیشنهادهای فونیما انجام نشد.
      </InlineMessage>
    );
  }

  const sections = data?.filter((section) => section.places.length > 0) ?? [];

  if (sections.length === 0) {
    return <EmptyHome />;
  }

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.id}>
          <SectionTitle>{section.title}</SectionTitle>

          <PlaceCardSlider
            places={section.places}
            onSaveChange={onSaveChange}
            className="mt-4"
          />
        </section>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text as="h2" variant="heading-md">
      {children}
    </Text>
  );
}

function EmptyHome() {
  return (
    <div
      className="
        rounded-[30px]
        bg-white
        px-5
        py-14
        text-center
        shadow-[0_8px_30px_rgba(0,0,0,0.03)]
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
        <FiMapPin />
      </div>

      <Text variant="heading-md" className="mt-5">
        هنوز پیشنهادی نداریم
      </Text>

      <Text
        tone="secondary"
        className="
          mx-auto
          mt-2
          max-w-md
        "
      >
        پس از اضافه شدن بخش‌های فعال توسط مدیریت، مکان‌ها اینجا نمایش داده
        می‌شوند.
      </Text>
    </div>
  );
}

function HomeSectionsLoading() {
  return (
    <div className="space-y-10">
      {[1, 2, 3].map((section) => (
        <div key={section}>
          <div
            className="
                h-7
                w-44
                animate-pulse
                rounded-lg
                bg-gray-200
              "
          />

          <div
            className="
                mt-4
                flex
                gap-3
                overflow-hidden
              "
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="
                      w-[260px]
                      shrink-0
                      overflow-hidden
                      rounded-3xl
                      bg-white
                    "
              >
                <div
                  className="
                        aspect-4/3
                        animate-pulse
                        bg-gray-100
                      "
                />

                <div className="space-y-3 p-4">
                  <div
                    className="
                          h-5
                          w-2/3
                          animate-pulse
                          rounded
                          bg-gray-100
                        "
                  />

                  <div
                    className="
                          h-4
                          w-1/2
                          animate-pulse
                          rounded
                          bg-gray-100
                        "
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchLoading() {
  return (
    <div>
      <div
        className="
          h-7
          w-28
          animate-pulse
          rounded
          bg-gray-200
        "
      />

      <div
        className="
          mt-5
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="
                overflow-hidden
                rounded-[26px]
                bg-white
              "
          >
            <div
              className="
                  aspect-16/11
                  animate-pulse
                  bg-gray-100
                "
            />

            <div className="space-y-3 p-4">
              <div
                className="
                    h-5
                    w-2/3
                    animate-pulse
                    rounded
                    bg-gray-100
                  "
              />

              <div
                className="
                    h-4
                    w-1/2
                    animate-pulse
                    rounded
                    bg-gray-100
                  "
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildSearchDescription({
  query,
  city,
  placeType,
  total,
}: {
  query: string;

  city: string;

  placeType: PlaceTypeValue | "";

  total: number;
}) {
  const parts: string[] = [];

  if (query.trim()) {
    parts.push(`«${query.trim()}»`);
  }

  if (city) {
    parts.push(city);
  }

  if (placeType) {
    const label = PLACE_TYPE_OPTIONS.find(
      (item) => item.value === placeType,
    )?.label;

    if (label) {
      parts.push(label);
    }
  }

  const suffix = parts.length > 0 ? ` برای ${parts.join("، ")}` : "";

  return `${total.toLocaleString("fa-IR")} مکان پیدا شد${suffix}`;
}
function SearchResults({
  query,
  city,
  placeType,
  data,
  pending,
  error,
  onSaveChange,
}: {
  query: string;

  city: string;

  placeType: PlaceTypeValue | "";

  data: SearchResultsData | undefined;

  pending: boolean;

  error: boolean;

  onSaveChange: (
    placeId: string,
    nextSaved: boolean,
  ) => void | Promise<unknown>;
}) {
  if (pending) {
    return <SearchLoading />;
  }

  if (error) {
    return (
      <InlineMessage variant="error">جستجوی مکان‌ها انجام نشد.</InlineMessage>
    );
  }

  const items = data?.items ?? [];

  return (
    <section>
      <div
        className="
          flex
          items-end
          justify-between
          gap-4
        "
      >
        <div>
          <SectionTitle>نتایج</SectionTitle>

          <Text variant="body-sm" tone="secondary" className="mt-1">
            {buildSearchDescription({
              query,

              city,

              placeType,

              total: data?.pagination.total ?? 0,
            })}
          </Text>
        </div>
      </div>

      {items.length === 0 ? (
        <div
          className="
            mt-5
            rounded-[28px]
            bg-white
            px-5
            py-14
            text-center
            shadow-[0_8px_30px_rgba(0,0,0,0.03)]
          "
        >
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-[20px]
              bg-(--color-brand-50)
              text-xl
              text-(--color-brand-500)
            "
          >
            <FiSearch />
          </div>

          <Text variant="heading-md" className="mt-4">
            نتیجه‌ای پیدا نشد
          </Text>

          <Text tone="secondary" className="mt-2">
            عبارت جستجو یا فیلترها را تغییر بده.
          </Text>
        </div>
      ) : (
        <div
          className="
            mt-5
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          {items.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onSaveChange={onSaveChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}
