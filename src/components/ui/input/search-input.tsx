"use client";

import { type InputHTMLAttributes, useEffect } from "react";

import { FiSearch, FiX } from "react-icons/fi";

import { IconButton } from "@/components/ui/button/icon-button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { Input } from "./input";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onClear?: () => void;

  onDebouncedChange?: (value: string) => void;

  debounceDelay?: number;
};

export function SearchInput({
  value,
  onClear,
  onDebouncedChange,
  debounceDelay = 400,
  ...props
}: SearchInputProps) {
  const stringValue = typeof value === "string" ? value : "";

  const debouncedValue = useDebouncedValue(stringValue, debounceDelay);

  const hasValue = stringValue.length > 0;

  useEffect(() => {
    onDebouncedChange?.(debouncedValue);
  }, [debouncedValue, onDebouncedChange]);

  return (
    <Input
      type="search"
      value={value}
      startIcon={<FiSearch aria-hidden="true" />}
      endIcon={
        hasValue && onClear ? (
          <IconButton
            type="button"
            size="sm"
            variant="tertiary"
            aria-label="پاک کردن جستجو"
            onClick={onClear}
          >
            <FiX />
          </IconButton>
        ) : undefined
      }
      {...props}
    />
  );
}
