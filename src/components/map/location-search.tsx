"use client";

import { useEffect, useRef, useState } from "react";

import { FiMapPin, FiSearch, FiX } from "react-icons/fi";

import type { MapSearchResult } from "@/lib/map/search-types";
import type { LngLat } from "@/lib/map/types";

type Props = {
  onSelect: (result: MapSearchResult) => void;

  userPosition?: LngLat | null;

  placeholder?: string;

  disabled?: boolean;
};

export function LocationSearch({
  onSelect,

  userPosition = null,

  placeholder = "جستجوی مکان، خیابان یا محله...",

  disabled = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  /*
   * برای cancel کردن request قبلی
   * هنگام تایپ سریع.
   */
  const requestControllerRef = useRef<AbortController | null>(null);

  /*
   * وقتی کاربر یک نتیجه را انتخاب می‌کند،
   * query را با نام آن نتیجه پر می‌کنیم.
   *
   * نباید این تغییر دوباره Search اجرا کند.
   */
  const skipNextSearchRef = useRef(false);

  const [query, setQuery] = useState("");

  const [results, setResults] = useState<MapSearchResult[]>([]);

  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * ========================================
   * CLOSE ON OUTSIDE CLICK
   * ========================================
   */
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  /*
   * ========================================
   * SEARCH DEBOUNCE
   * ========================================
   */
  useEffect(() => {
    /*
     * اگر تغییر query به خاطر انتخاب
     * یک Search Result بوده،
     * Search دوباره اجرا نشود.
     */
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;

      return;
    }

    const value = query.trim();

    if (value.length < 2) {
      requestControllerRef.current?.abort();

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);

      setError(null);

      setLoading(false);

      return;
    }

    const timeout = window.setTimeout(() => {
      // eslint-disable-next-line react-hooks/immutability
      void searchLocation(value);
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, userPosition?.[0], userPosition?.[1]]);

  /*
   * ========================================
   * CLEANUP REQUEST
   * ========================================
   */
  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  /*
   * ========================================
   * SEARCH
   * ========================================
   */
  async function searchLocation(value: string) {
    /*
     * Search قبلی را cancel می‌کنیم.
     */
    requestControllerRef.current?.abort();

    const controller = new AbortController();

    requestControllerRef.current = controller;

    setLoading(true);

    setError(null);

    const params = new URLSearchParams({
      q: value,
    });

    /*
     * اگر موقعیت فعلی کاربر را داریم،
     * برای location bias به backend می‌دهیم.
     */
    if (userPosition) {
      params.set("lon", String(userPosition[0]));

      params.set("lat", String(userPosition[1]));
    }

    try {
      const response = await fetch(`/api/map/search?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("SEARCH_FAILED");
      }

      const data = (await response.json()) as {
        items: MapSearchResult[];
      };

      const uniqueResults = removeDuplicateResults(data.items);

      /*
       * ممکن است در فاصله دریافت response
       * request جدیدی ایجاد شده باشد.
       */
      if (requestControllerRef.current !== controller) {
        return;
      }

      setResults(uniqueResults);

      setOpen(true);
    } catch (error) {
      /*
       * Abort یعنی کاربر سریع‌تر تایپ کرده
       * و request قبلی عمداً cancel شده.
       */
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("[Location Search]", error);

      setResults([]);

      setError("جستجوی مکان انجام نشد.");

      setOpen(true);
    } finally {
      if (requestControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }

  /*
   * ========================================
   * SELECT RESULT
   * ========================================
   */
  function handleSelect(result: MapSearchResult) {
    /*
     * Search فعلی اگر هنوز pending باشد
     * دیگر نیازی به آن نداریم.
     */
    requestControllerRef.current?.abort();

    /*
     * setQuery پایین نباید Search جدید
     * راه بیندازد.
     */
    skipNextSearchRef.current = true;

    /*
     * نام مکان انتخاب‌شده داخل input.
     */
    setQuery(result.name);

    /*
     * dropdown باید فوراً بسته شود.
     */
    setOpen(false);

    /*
     * نتایج قبلی را هم خالی می‌کنیم
     * تا با focus دوباره ظاهر نشوند.
     */
    setResults([]);

    setError(null);

    setLoading(false);

    /*
     * LocationPicker / MapTest
     * موقعیت را دریافت می‌کند.
     */
    onSelect(result);
  }

  /*
   * ========================================
   * CLEAR
   * ========================================
   */
  function clearSearch() {
    requestControllerRef.current?.abort();

    skipNextSearchRef.current = false;

    setQuery("");

    setResults([]);

    setError(null);

    setOpen(false);

    setLoading(false);
  }

  return (
    <div
      ref={rootRef}
      className="
        relative
        z-1500
        isolate
      "
    >
      {/*
       * ========================================
       * SEARCH INPUT
       * ========================================
       */}
      <div
        className="
          relative
          z-1501
        "
      >
        <FiSearch
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            text-lg
            text-(--color-text-secondary)
          "
        />

        <input
          type="search"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            if (results.length > 0 || error) {
              setOpen(true);
            }
          }}
          onChange={(event) => {
            skipNextSearchRef.current = false;

            setQuery(event.target.value);

            setOpen(true);
          }}
          className="
            relative
            z-1501
            h-14
            w-full
            rounded-full
            border
            border-(--color-border-strong)
            bg-white
            pr-12
            pl-12
            text-[16px]
            outline-none
            transition

            focus:border-(--color-brand-500)
            focus:ring-2
            focus:ring-(--color-brand-100)

            disabled:cursor-not-allowed
            disabled:bg-gray-100
          "
        />

        {loading && (
          <span
            aria-label="در حال جستجو"
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              z-1502
              h-5
              w-5
              -translate-y-1/2
              animate-spin
              rounded-full
              border-2
              border-gray-200
              border-t-(--color-brand-500)
            "
          />
        )}

        {!loading && query && (
          <button
            type="button"
            aria-label="پاک کردن جستجو"
            onClick={clearSearch}
            className="
              absolute
              left-3
              top-1/2
              z-1502
              flex
              h-9
              w-9
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              text-(--color-text-secondary)
              transition-colors
              hover:bg-gray-100
            "
          >
            <FiX />
          </button>
        )}
      </div>

      {/*
       * ========================================
       * RESULTS
       * ========================================
       */}
      {open && query.trim().length >= 2 && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]
            z-2000
            max-h-[min(320px,50vh)]
            overflow-x-hidden
            overflow-y-auto
            overscroll-contain
            rounded-[20px]
            border
            border-(--color-border)
            bg-white
            p-2
            shadow-[0_18px_50px_rgba(0,0,0,0.18)]
          "
        >
          {error ? (
            <div
              className="
                px-4
                py-6
                text-center
                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <button
                key={`${result.id}-${result.position[0]}-${result.position[1]}-${index}`}
                type="button"
                onClick={() => handleSelect(result)}
                className="
                  flex
                  w-full
                  items-start
                  gap-3
                  rounded-[14px]
                  px-3
                  py-3
                  text-right
                  transition-colors
                  hover:bg-gray-50
                  focus:bg-gray-50
                  focus:outline-none
                "
              >
                <span
                  className="
                    mt-0.5
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-(--color-brand-50)
                    text-(--color-brand-600)
                  "
                >
                  <FiMapPin />
                </span>

                <span
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <span
                    className="
                      block
                      font-semibold
                      text-(--color-text-primary)
                    "
                  >
                    {result.name}
                  </span>

                  <span
                    className="
                      mt-1
                      block
                      line-clamp-2
                      text-xs
                      leading-5
                      text-(--color-text-secondary)
                    "
                  >
                    {result.label}
                  </span>
                </span>
              </button>
            ))
          ) : !loading ? (
            <div
              className="
                px-4
                py-6
                text-center
                text-sm
                text-(--color-text-secondary)
              "
            >
              نتیجه‌ای پیدا نشد.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/*
 * ========================================
 * REMOVE DUPLICATE SEARCH RESULTS
 * ========================================
 */
function removeDuplicateResults(items: MapSearchResult[]) {
  const seen = new Set<string>();

  const result: MapSearchResult[] = [];

  for (const item of items) {
    const signature = [
      item.id,

      item.position[0].toFixed(6),

      item.position[1].toFixed(6),
    ].join(":");

    if (seen.has(signature)) {
      continue;
    }

    seen.add(signature);

    result.push(item);
  }

  return result;
}
