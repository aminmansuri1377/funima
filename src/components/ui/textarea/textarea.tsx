"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import type { InputState } from "@/components/ui/input/input";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  state?: InputState;
  resize?: boolean;
};

const stateClasses: Record<InputState, string> = {
  default: cn(
    "border-[var(--color-border-strong)]",
    "focus:border-[var(--color-brand-500)]",
  ),

  error: cn(
    "border-[var(--color-error-500)]",
    "focus:border-[var(--color-error-500)]",
  ),

  success: cn(
    "border-[var(--color-success-500)]",
    "focus:border-[var(--color-success-500)]",
  ),
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { state = "default", resize = true, disabled, className, ...props },
    ref,
  ) {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          "min-h-32 w-full",
          "rounded-[var(--radius-xl)]",
          "border",
          "bg-[var(--color-surface)]",
          "px-5 py-4",

          "text-[16px]",
          "leading-7",
          "text-[var(--color-text-primary)]",

          "outline-none",

          "placeholder:text-[var(--color-text-secondary)]",

          "transition-[border-color,box-shadow,background-color]",
          "duration-[var(--duration-normal)]",

          "focus:ring-2",
          "focus:ring-[var(--color-brand-100)]",

          stateClasses[state],

          !resize && "resize-none",

          disabled &&
            cn(
              "cursor-not-allowed",
              "border-[var(--color-border)]",
              "bg-[var(--color-gray-100)]",
              "text-[var(--color-text-disabled)]",
            ),

          className,
        )}
        {...props}
      />
    );
  },
);
