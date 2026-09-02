"use client";

import type { InputHTMLAttributes } from "react";

import { FiSearch, FiX } from "react-icons/fi";

import { IconButton } from "@/components/ui/button/icon-button";

import { Input } from "./input";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onClear?: () => void;
};

export function SearchInput({ value, onClear, ...props }: SearchInputProps) {
  const hasValue = typeof value === "string" && value.length > 0;

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
