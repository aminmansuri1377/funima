"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { Button } from "./button";

import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";

type PaginationProps = {
  page: number;
  totalPages: number;

  pageSize?: number;

  totalItems?: number;

  disabled?: boolean;

  onPageChange: (page: number) => void;

  onPageSizeChange?: (pageSize: number) => void;
};

export function Pagination({
  page,
  totalPages,
  pageSize = 20,
  totalItems,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  const start =
    totalItems === undefined
      ? null
      : totalItems === 0
        ? 0
        : (page - 1) * pageSize + 1;

  const end =
    totalItems === undefined ? null : Math.min(page * pageSize, totalItems);

  return (
    <div
      className="
        flex flex-col gap-4
        rounded-lg
        border
        border-(--color-border)
        bg-(--color-surface)
        px-4 py-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div
        className="
          flex flex-wrap
          items-center
          gap-3
        "
      >
        {totalItems !== undefined && (
          <span
            className="
              text-sm
              text-(--color-text-secondary)
            "
          >
            نمایش {start} تا {end} از {totalItems}
          </span>
        )}

        {onPageSizeChange && (
          <label
            className="
              flex
              items-center
              gap-2
              text-sm
              text-(--color-text-secondary)
            "
          >
            تعداد در صفحه
            <select
              value={pageSize}
              disabled={disabled}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="
                h-9
                rounded-lg
                border
                border-(--color-border)
                bg-white
                px-2
                outline-none
              "
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <FiChevronRight />
        </Button>

        <div
          className="
            min-w-24
            text-center
            text-sm
          "
        >
          صفحه {page} از {safeTotalPages}
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <FiChevronLeft />
        </Button>
      </div>
    </div>
  );
}
