"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary";

type ButtonSize =
  | "xl"
  | "lg"
  | "md"
  | "sm";

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    loading?: boolean;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
  };

const variants: Record<
  ButtonVariant,
  string
> = {
  primary: cn(
    "bg-[var(--color-brand-500)]",
    "text-white",
    "border border-transparent",
    "hover:bg-[var(--color-brand-600)]",
    "active:bg-[var(--color-brand-700)]",
    "disabled:bg-[var(--color-gray-200)]",
    "disabled:text-[var(--color-text-disabled)]",
  ),

  secondary: cn(
    "bg-transparent",
    "text-[var(--color-brand-500)]",
    "border border-[var(--color-brand-500)]",
    "hover:bg-[var(--color-brand-50)]",
    "active:bg-[var(--color-brand-100)]",
    "disabled:border-[var(--color-gray-300)]",
    "disabled:text-[var(--color-text-disabled)]",
  ),

  tertiary: cn(
    "bg-transparent",
    "text-[var(--color-brand-500)]",
    "border border-transparent",
    "hover:bg-[var(--color-brand-50)]",
    "active:bg-[var(--color-brand-100)]",
    "disabled:text-[var(--color-text-disabled)]",
  ),
};

const sizes: Record<
  ButtonSize,
  string
> = {
  xl:
    "h-14 px-8 text-lg font-medium",

  lg:
    "h-12 px-6 text-base font-medium",

  md:
    "h-10 px-5 text-sm font-medium",

  sm:
    "h-8 px-4 text-xs font-medium",
};

export const Button =
  forwardRef<
    HTMLButtonElement,
    ButtonProps
  >(function Button(
    {
      variant = "primary",
      size = "lg",
      fullWidth = false,
      loading = false,
      startIcon,
      endIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const isDisabled =
      disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "rounded-[var(--radius-full)]",
          "transition-colors",
          "duration-[var(--duration-normal)]",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[var(--color-brand-300)]",
          "focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="
              h-4 w-4
              animate-spin
              rounded-full
              border-2
              border-current
              border-t-transparent
            "
          />
        ) : (
          startIcon
        )}

        <span>{children}</span>

        {!loading &&
          endIcon}
      </button>
    );
  });