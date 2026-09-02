"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type InputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    error?: boolean;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
  };

export const Input =
  forwardRef<
    HTMLInputElement,
    InputProps
  >(function Input(
    {
      error = false,
      startIcon,
      endIcon,
      className,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <div
        className={cn(
          "flex h-14 w-full items-center gap-3",
          "rounded-[var(--radius-full)]",
          "border bg-white px-5",
          "transition-colors",
          error
            ? "border-[var(--color-error-500)]"
            : "border-[var(--color-text-primary)]",
          "focus-within:border-[var(--color-brand-500)]",
          disabled &&
            "bg-[var(--color-gray-100)] opacity-70",
          className,
        )}
      >
        {startIcon && (
          <span
            className="
              shrink-0
              text-[var(--color-text-secondary)]
            "
          >
            {startIcon}
          </span>
        )}

        <input
          ref={ref}
          disabled={disabled}
          className="
            min-w-0 flex-1
            bg-transparent
            text-[16px]
            text-[var(--color-text-primary)]
            outline-none
            placeholder:text-[var(--color-text-secondary)]
            disabled:cursor-not-allowed
          "
          {...props}
        />

        {endIcon && (
          <span
            className="
              shrink-0
              text-[var(--color-text-secondary)]
            "
          >
            {endIcon}
          </span>
        )}
      </div>
    );
  });