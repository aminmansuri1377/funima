import type {
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type TextVariant =
  | "display"
  | "heading-xl"
  | "heading-lg"
  | "heading-md"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "label-lg"
  | "label-md"
  | "caption";

type TextTone =
  | "primary"
  | "secondary"
  | "brand"
  | "error"
  | "success"
  | "disabled";

type TextProps = {
  as?: ElementType;
  variant?: TextVariant;
  tone?: TextTone;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>;

const variants: Record<TextVariant, string> = {
  display:
    "text-[40px] leading-[1.25] font-extrabold",

  "heading-xl":
    "text-[32px] leading-[1.35] font-bold",

  "heading-lg":
    "text-[26px] leading-[1.4] font-bold",

  "heading-md":
    "text-[22px] leading-[1.45] font-bold",

  "body-lg":
    "text-[18px] leading-8 font-normal",

  "body-md":
    "text-[16px] leading-7 font-normal",

  "body-sm":
    "text-[14px] leading-6 font-normal",

  "label-lg":
    "text-[16px] leading-6 font-semibold",

  "label-md":
    "text-[14px] leading-5 font-semibold",

  caption:
    "text-[12px] leading-5 font-normal",
};

const tones: Record<TextTone, string> = {
  primary:
    "text-[var(--color-text-primary)]",

  secondary:
    "text-[var(--color-text-secondary)]",

  brand:
    "text-[var(--color-brand-500)]",

  error:
    "text-[var(--color-error-500)]",

  success:
    "text-[var(--color-success-500)]",

  disabled:
    "text-[var(--color-text-disabled)]",
};

export function Text({
  as: Component = "p",
  variant = "body-md",
  tone = "primary",
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Component
      className={cn(
        variants[variant],
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}