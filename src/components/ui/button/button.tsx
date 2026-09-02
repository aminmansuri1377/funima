"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";

export type ButtonSize = "xl" | "lg" | "md" | "sm";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;

  fullWidth?: boolean;

  loading?: boolean;

  startIcon?: ReactNode;
  endIcon?: ReactNode;

  iconOnly?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    "border border-transparent",
    "bg-[var(--color-brand-500)]",
    "text-[var(--color-text-inverse)]",

    "hover:bg-[var(--color-brand-600)]",

    "active:bg-[var(--color-brand-700)]",

    "disabled:bg-[var(--color-gray-200)]",
    "disabled:text-[var(--color-text-disabled)]",
  ),

  secondary: cn(
    "border",
    "border-[var(--color-brand-500)]",
    "bg-transparent",
    "text-[var(--color-brand-500)]",

    "hover:bg-[var(--color-brand-50)]",

    "active:bg-[var(--color-brand-100)]",

    "disabled:border-[var(--color-border)]",
    "disabled:text-[var(--color-text-disabled)]",
  ),

  tertiary: cn(
    "border border-transparent",
    "bg-transparent",
    "text-[var(--color-brand-500)]",

    "hover:bg-[var(--color-brand-50)]",

    "active:bg-[var(--color-brand-100)]",

    "disabled:text-[var(--color-text-disabled)]",
  ),

  danger: cn(
    "border border-transparent",
    "bg-[var(--color-error-500)]",
    "text-white",

    "hover:opacity-90",
    "active:opacity-80",

    "disabled:bg-[var(--color-gray-200)]",
    "disabled:text-[var(--color-text-disabled)]",
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  xl: "h-14 px-8 text-[18px] font-semibold",
  lg: "h-12 px-6 text-[16px] font-semibold",
  md: "h-10 px-5 text-[14px] font-semibold",
  sm: "h-8 px-4 text-[12px] font-semibold",
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  xl: "h-14 w-14 p-0",
  lg: "h-12 w-12 p-0",
  md: "h-10 w-10 p-0",
  sm: "h-8 w-8 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "lg",

      fullWidth = false,

      loading = false,

      startIcon,
      endIcon,

      iconOnly = false,

      disabled,

      className,

      children,

      type = "button",

      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "relative",
          "inline-flex items-center justify-center",
          "gap-2",

          "rounded-[var(--radius-full)]",

          "font-abar",

          "transition-[background-color,color,border-color,opacity,box-shadow,transform]",
          "duration-[var(--duration-normal)]",

          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[var(--color-brand-300)]",
          "focus-visible:ring-offset-2",

          "disabled:cursor-not-allowed",

          variantClasses[variant],

          iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],

          fullWidth && !iconOnly && "w-full",

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

        {!iconOnly && <span>{children}</span>}

        {!loading && !iconOnly && endIcon}

        {iconOnly && !loading && children}
      </button>
    );
  },
);
