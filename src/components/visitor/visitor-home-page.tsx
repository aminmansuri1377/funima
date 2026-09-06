"use client";

import { useMemo, useState } from "react";

import { FiMapPin, FiSearch, FiTag } from "react-icons/fi";

import { FaGamepad, FaHeart, FaUsers } from "react-icons/fa";

import type { inferRouterOutputs } from "@trpc/server";

import { usePlaceSave } from "@/hooks/visitor/use-place-save";

import type { AppRouter } from "@/server/trpc/root";

import {
  InlineMessage,
  SearchInput,
  SearchSelect,
  Text,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

import { PlaceCard } from "./place-card";
import { PlaceCardSlider } from "./place-card-slider";
import { VisitorFooter } from "./visitor-footer";
import { VisitorPageShell } from "./visitor-page-shell";

type RouterOutputs = inferRouterOutputs<AppRouter>;

type HomeSectionsData = RouterOutputs["visitor"]["home"]["getSections"];

type SearchResultsData = RouterOutputs["visitor"]["places"]["list"];

type Props = {
  canSave: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
  groupName: string;
};

export function VisitorHomePage({ canSave }: Props) {
  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [city, setCity] = useState("");

  /*
   * این دیگر PlaceType نیست.
   *
   * مقدار انتخاب‌شده یکی از FilterValueهای
   * ساخته‌شده در پنل مدیریت است.
   */
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [saveError, setSaveError] = useState<string | null>(null);

  /*
   * ========================================
   * HOME DATA
   * ========================================
   */

  const sections = trpc.visitor.home.getSections.useQuery();

  const cities = trpc.visitor.home.getCities.useQuery();

  const filters = trpc.visitor.home.getFilters.useQuery();

  /*
   * ========================================
   * CITY OPTIONS
   * ========================================
   */

  const cityOptions = useMemo(() => {
    const data = cities.data ?? [];

    return data.map((item) => ({
      value: item.city,

      label: item.province ? `${item.city}، ${item.province}` : item.city,
    }));
  }, [cities.data]);

  /*
   * ========================================
   * CATEGORY OPTIONS
   * ========================================
   *
   * همه FilterValueها را به یک لیست
   * افقی تبدیل می‌کنیم.
   *
   * در نتیجه Admin هر گزینه‌ای مثل:
   *
   * دو نفره
   * دورهمی
   * گیم و سرگرمی
   *
   * بسازد، خودکار در Home ظاهر می‌شود.
   */

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const data = filters.data ?? [];

    return data.flatMap((filter) =>
      filter.values.map((value) => ({
        id: value.id,
        name: value.name,
        groupName: filter.name,
      })),
    );
  }, [filters.data]);

  /*
   * ========================================
   * ACTIVE SEARCH
   * ========================================
   */

  const hasActiveSearch = Boolean(
    debouncedSearch.trim() || city || selectedCategoryId,
  );

  /*
   * ========================================
   * SEARCH RESULTS
   * ========================================
   */

  const searchResults = trpc.visitor.places.list.useQuery(
    {
      page: 1,

      pageSize: 24,

      search: debouncedSearch.trim() || undefined,

      city: city || undefined,

      filterValueIds: selectedCategoryId ? [selectedCategoryId] : undefined,
    },
    {
      enabled: hasActiveSearch,
    },
  );

  /*
   * ========================================
   * SAVE
   * ========================================
   */

  const placeSave = usePlaceSave();

  async function handleSaveChange(placeId: string, nextSaved: boolean) {
    if (!canSave) {
      return;
    }

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

  const saveHandler = canSave ? handleSaveChange : undefined;

  return (
    <VisitorPageShell maxWidth="wide">
      <div className="pb-2">
        {/*
         * ========================================
         * TITLE
         * ========================================
         */}

        <HomeIntro />

        {/*
         * ========================================
         * SEARCH + CITY
         * ========================================
         */}

        <section className="mt-8">
          <div
            className="
              grid
              grid-cols-[minmax(0,1fr)_105px]
              gap-3

              sm:grid-cols-[minmax(0,1fr)_150px]
              sm:gap-4
            "
          >
            <div
              className="
                min-w-0
                rounded-full
                bg-white
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
                placeholder="جستجو"
              />
            </div>

            <div
              className="
                min-w-0
                rounded-full
                bg-white
              "
            >
              <SearchSelect
                value={city}
                options={cityOptions}
                onChange={setCity}
                placeholder="شهر"
                searchPlaceholder="جستجوی شهر..."
                emptyMessage="شهری پیدا نشد."
                disabled={cities.isPending}
                clearable
              />
            </div>
          </div>

          {/*
           * ========================================
           * CATEGORY FILTERS
           * ========================================
           */}

          <CategoryFilters
            options={categoryOptions}
            value={selectedCategoryId}
            loading={filters.isPending}
            onChange={setSelectedCategoryId}
          />
        </section>

        {/*
         * ========================================
         * SAVE ERROR
         * ========================================
         */}

        {canSave && saveError && (
          <div className="mt-5">
            <InlineMessage variant="error">{saveError}</InlineMessage>
          </div>
        )}

        {/*
         * ========================================
         * CONTENT
         * ========================================
         */}

        <div className="mt-12">
          {hasActiveSearch ? (
            <SearchResults
              data={searchResults.data}
              pending={searchResults.isPending}
              error={Boolean(searchResults.error)}
              onSaveChange={saveHandler}
            />
          ) : (
            <HomeSections
              data={sections.data}
              pending={sections.isPending}
              error={Boolean(sections.error)}
              onSaveChange={saveHandler}
            />
          )}
        </div>

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
 * INTRO
 * ===================================================== */

function HomeIntro() {
  return (
    <div
      className="
        pt-1
        text-center
      "
    >
      <Text
        as="h1"
        variant="heading-xl"
        className="
          text-[27px]
          font-black
          leading-[1.35]
          tracking-[-0.4px]
          text-[#07111f]

          sm:text-[31px]
        "
      >
        ماجراجویی رو شروع کن !
      </Text>
    </div>
  );
}

/* =====================================================
 * CATEGORY FILTERS
 * ===================================================== */

function CategoryFilters({
  options,
  value,
  loading,
  onChange,
}: {
  options: CategoryOption[];

  value: string;

  loading: boolean;

  onChange: (value: string) => void;
}) {
  if (loading) {
    return (
      <div
        className="
          -mx-3
          mt-7
          flex
          gap-3
          overflow-hidden
          px-3
        "
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="
                h-[56px]
                min-w-[145px]
                animate-pulse
                rounded-full
                bg-white/70
              "
          />
        ))}
      </div>
    );
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div
      className="
        -mx-3
        mt-7
        flex
        gap-3
        overflow-x-auto
        px-3
        pb-1

        sm:-mx-0
        sm:px-0

        [&::-webkit-scrollbar]:hidden
        [scrollbar-width:none]
      "
    >
      {options.map((option) => {
        const active = value === option.id;

        return (
          <CategoryChip
            key={option.id}
            name={option.name}
            active={active}
            onClick={() => {
              /*
               * اگر روی گزینه فعال دوباره
               * کلیک شود، فیلتر پاک می‌شود.
               */
              onChange(active ? "" : option.id);
            }}
          />
        );
      })}
    </div>
  );
}

/* =====================================================
 * CATEGORY CHIP
 * ===================================================== */

function CategoryChip({
  name,
  active,
  onClick,
}: {
  name: string;

  active: boolean;

  onClick: () => void;
}) {
  const categoryStyle = getCategoryVisual(name);

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`
        flex
        h-10
        min-w-[145px]
        shrink-0
        items-center
        justify-center
        gap-3
        rounded-full
        border
        px-5
        text-[16px]
        font-semibold
        transition-all
        duration-200

        sm:h-[58px]
        sm:min-w-[185px]

        ${
          active
            ? `
              border-transparent
              bg-[#FF693B]
              text-white
            `
            : `
              border-transparent
              bg-white
              text-[#0B1728]

              hover:bg-white/80
            `
        }
      `}
    >
      <span
        aria-hidden="true"
        className={`
          flex
          items-center
          justify-center
          text-[23px]

          ${active ? "text-white" : categoryStyle.color}
        `}
      >
        {/* {categoryStyle.icon} */}
      </span>

      <span className="whitespace-nowrap">{name}</span>
    </button>
  );
}

/* =====================================================
 * CATEGORY ICON
 * ===================================================== */

function getCategoryVisual(name: string): {
  icon: React.ReactNode;
  color: string;
} {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");

  /*
   * دو نفره / دیت / قرار
   */
  if (
    normalized.includes("دو نفر") ||
    normalized.includes("دونفر") ||
    normalized.includes("دیت") ||
    normalized.includes("قرار")
  ) {
    return {
      icon: <FaHeart />,
      color: "text-[#EB4B4B]",
    };
  }

  /*
   * دورهمی / دوستانه / گروهی
   */
  if (
    normalized.includes("دورهم") ||
    normalized.includes("دوست") ||
    normalized.includes("گروه")
  ) {
    return {
      icon: <FaUsers />,
      color: "text-[#367DF5]",
    };
  }

  /*
   * گیم / بازی / سرگرمی
   */
  if (
    normalized.includes("گیم") ||
    normalized.includes("بازی") ||
    normalized.includes("سرگرمی") ||
    normalized.includes("game")
  ) {
    return {
      icon: <FaGamepad />,
      color: "text-[#FF7A1A]",
    };
  }

  /*
   * fallback برای گزینه‌هایی که
   * بعداً Admin اضافه می‌کند.
   */
  return {
    icon: <FiTag />,
    color: "text-(--color-brand-500)",
  };
}

/* =====================================================
 * HOME SECTIONS
 * ===================================================== */

function HomeSections({
  data,
  pending,
  error,
  onSaveChange,
}: {
  data: HomeSectionsData | undefined;

  pending: boolean;

  error: boolean;

  onSaveChange?:
    | ((placeId: string, nextSaved: boolean) => void | Promise<unknown>)
    | undefined;
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
    <div
      className="
        space-y-11
        sm:space-y-14
      "
    >
      {sections.map((section) => (
        <section key={section.id}>
          <SectionTitle>{section.title}</SectionTitle>

          <PlaceCardSlider
            places={section.places}
            onSaveChange={onSaveChange}
            className="mt-5 mr-5"
          />
        </section>
      ))}
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
      variant="heading-md"
      className="
        text-[22px]
        font-black
        leading-[1.4]
        tracking-[-0.25px]
        text-[#080d16]

        sm:text-[24px]
      "
    >
      {children}
    </Text>
  );
}

/* =====================================================
 * EMPTY HOME
 * ===================================================== */

function EmptyHome() {
  return (
    <div
      className="
        rounded-[30px]
        bg-white
        px-5
        py-14
        text-center
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

/* =====================================================
 * HOME SECTIONS LOADING
 * ===================================================== */

function HomeSectionsLoading() {
  return (
    <div
      className="
        space-y-11
        sm:space-y-14
      "
    >
      {[1, 2, 3].map((section) => (
        <div key={section}>
          <div
            className="
                h-7
                w-48
                animate-pulse
                rounded-lg
                bg-gray-200
              "
          />

          <div
            className="
                mt-5
                flex
                gap-4
                overflow-hidden
              "
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="
                      w-[64vw]
                      min-w-[250px]
                      max-w-[310px]
                      shrink-0
                    "
              >
                <div
                  className="
                        aspect-[1.45/1]
                        animate-pulse
                        rounded-[22px]
                        bg-gray-200
                      "
                />

                <div
                  className="
                        mt-4
                        space-y-2
                      "
                >
                  <div
                    className="
                          h-5
                          w-2/3
                          animate-pulse
                          rounded
                          bg-gray-200
                        "
                  />

                  <div
                    className="
                          h-4
                          w-4/5
                          animate-pulse
                          rounded
                          bg-gray-200
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

/* =====================================================
 * SEARCH LOADING
 * ===================================================== */

function SearchLoading() {
  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[640px]
        space-y-8
      "
    >
      {[1, 2, 3].map((item) => (
        <div key={item}>
          <div
            className="
                aspect-[1.55/1]
                w-full
                animate-pulse
                rounded-[22px]
                bg-gray-200
              "
          />

          <div
            className="
                mt-4
                space-y-2
              "
          >
            <div
              className="
                  h-5
                  w-2/3
                  animate-pulse
                  rounded
                  bg-gray-200
                "
            />

            <div
              className="
                  h-4
                  w-1/2
                  animate-pulse
                  rounded
                  bg-gray-200
                "
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
 * SEARCH RESULTS
 * ===================================================== */

function SearchResults({
  data,
  pending,
  error,
  onSaveChange,
}: {
  data: SearchResultsData | undefined;

  pending: boolean;

  error: boolean;

  onSaveChange?:
    | ((placeId: string, nextSaved: boolean) => void | Promise<unknown>)
    | undefined;
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

  if (items.length === 0) {
    return (
      <div
        className="
          rounded-[30px]
          bg-white
          px-5
          py-14
          text-center
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
    );
  }

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-[640px]
      "
    >
      {/*
       * دقیقاً مثل Figma:
       *
       * در هر ردیف فقط یک کارت.
       *
       * grid دو یا سه ستونه نداریم.
       */}

      <div
        className="
          flex
          flex-col
          gap-9
        "
      >
        {items.map((place) => (
          <PlaceCard key={place.id} place={place} onSaveChange={onSaveChange} />
        ))}
      </div>
    </section>
  );
}
