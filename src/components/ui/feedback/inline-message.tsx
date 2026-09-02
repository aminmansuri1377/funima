import type {
  ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type InlineMessageVariant =
  | "error"
  | "success"
  | "warning"
  | "info";

type InlineMessageProps = {
  variant?: InlineMessageVariant;
  children: ReactNode;
  className?: string;
};

const variants: Record<
  InlineMessageVariant,
  string
> = {
  error:
    "text-[var(--color-error-500)]",

  success:
    "text-[var(--color-success-500)]",

  warning:
    "text-[var(--color-warning-500)]",

  info:
    "text-[var(--color-info-500)]",
};

export function InlineMessage({
  variant = "info",
  children,
  className,
}: InlineMessageProps) {
  return (
    <p
      role={
        variant === "error"
          ? "alert"
          : "status"
      }
      className={cn(
        "text-sm leading-6",
        variants[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}