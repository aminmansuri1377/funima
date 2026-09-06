"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type InputState = "default" | "error" | "success";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  state?: InputState;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

const stateClasses: Record<InputState, string> = {
  default: cn(
    "border-gray-300",
    "focus-within:border-[var(--color-brand-500)]",
  ),

  error: cn(
    "border-[var(--color-error-500)]",
    "focus-within:border-[var(--color-error-500)]",
  ),

  success: cn(
    "border-[var(--color-success-500)]",
    "focus-within:border-[var(--color-success-500)]",
  ),
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { state = "default", startIcon, endIcon, className, disabled, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "flex h-12 w-full items-center gap-3",
        "rounded-(--radius-full)",
        "border",
        "bg-(--color-surface)",
        "px-5",

        "transition-[border-color,box-shadow,background-color]",
        "duration-(--duration-normal)",

        "focus-within:ring-2",
        "focus-within:ring-(--color-brand-100)",

        stateClasses[state],

        disabled &&
          cn(
            "cursor-not-allowed",
            "border-(--color-border)",
            "bg-gray-100",
            "text-(--color-text-disabled)",
          ),

        className,
      )}
    >
      {startIcon && (
        <span
          className="
              flex shrink-0 items-center
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
            disabled:text-[var(--color-text-disabled)]
          "
        {...props}
      />

      {endIcon && (
        <span
          className="
              flex shrink-0 items-center
              text-[var(--color-text-secondary)]
            "
        >
          {endIcon}
        </span>
      )}
    </div>
  );
});
