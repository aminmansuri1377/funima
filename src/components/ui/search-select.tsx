"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FiCheck, FiChevronDown, FiSearch, FiX } from "react-icons/fi";

type SearchSelectOption = {
  value: string;
  label: string;
};

type SearchSelectProps = {
  value: string;

  options: SearchSelectOption[];

  onChange: (value: string) => void;

  placeholder?: string;

  searchPlaceholder?: string;

  emptyMessage?: string;

  disabled?: boolean;

  clearable?: boolean;
};

export function SearchSelect({
  value,
  options,
  onChange,
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو...",
  emptyMessage = "موردی پیدا نشد.",
  disabled = false,
  clearable = false,
}: SearchSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const query = normalize(search);

    if (!query) {
      return options;
    }

    return options.filter((option) => normalize(option.label).includes(query));
  }, [options, search]);

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

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch("");

      return;
    }

    const timeout = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [open]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);

    setOpen(false);
    setSearch("");
  }

  function handleClear(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    onChange("");

    setSearch("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) {
            setOpen((value) => !value);
          }
        }}
        className="
          flex h-14
          w-full
          items-center
          justify-between
          gap-3
          rounded-(--radius-full)
          border
          border-(--color-border-strong)
          bg-(--color-surface)
          px-5
          text-right
          text-[16px]
          text-(--color-text-primary)
          outline-none
          transition-colors

          focus:border-(--color-brand-500)
          focus:ring-2
          focus:ring-(--color-brand-100)

          disabled:cursor-not-allowed
          disabled:bg-gray-100
          disabled:text-(--color-text-secondary)
        "
      >
        <span
          className={
            selectedOption
              ? "truncate"
              : "truncate text-(--color-text-secondary)"
          }
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          {clearable && value && !disabled && (
            <button
              type="button"
              aria-label="پاک کردن انتخاب"
              onClick={handleClear}
              className="
                  flex h-8 w-8
                  items-center
                  justify-center
                  rounded-full
                  transition-colors
                  hover:bg-gray-100
                "
            >
              <FiX aria-hidden />
            </button>
          )}

          <FiChevronDown
            aria-hidden
            className={
              open ? "rotate-180 transition-transform" : "transition-transform"
            }
          />
        </div>
      </button>

      {open && !disabled && (
        <div
          className="
              absolute
              z-50
              mt-2
              w-full
              overflow-hidden
              rounded-2xl
              border
              border-(--color-border)
              bg-white
              shadow-lg
            "
        >
          <div
            className="
                border-b
                border-(--color-border)
                p-3
              "
          >
            <div className="relative">
              <FiSearch
                aria-hidden
                className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-(--color-text-secondary)
                  "
              />

              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-(--color-border)
                    bg-gray-50
                    pr-11
                    pl-4
                    outline-none

                    focus:border-(--color-brand-500)
                    focus:bg-white
                  "
              />
            </div>
          </div>

          <div
            role="listbox"
            className="
                max-h-64
                overflow-y-auto
                p-2
              "
          >
            {filteredOptions.length === 0 ? (
              <div
                className="
                    px-4
                    py-8
                    text-center
                    text-sm
                    text-(--color-text-secondary)
                  "
              >
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const selected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(option.value)}
                    className={`
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3
                          rounded-xl
                          px-4
                          py-3
                          text-right
                          transition-colors

                          ${
                            selected
                              ? "bg-(--color-brand-50) text-(--color-brand-700)"
                              : "hover:bg-gray-50"
                          }
                        `}
                  >
                    <span>{option.label}</span>

                    {selected && (
                      <FiCheck
                        aria-hidden
                        className="shrink-0 text-(--color-brand-500)"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک");
}
