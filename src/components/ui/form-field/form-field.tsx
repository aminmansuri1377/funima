import type {
  ReactNode,
} from "react";

import {
  Text,
} from "@/components/ui/typography";

import { cn } from "@/lib/cn";

type FormFieldProps = {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  description,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2",
        className,
      )}
    >
      {label && (
        <Text
          as="label"
          variant="label-md"
        >
          {label}

          {required && (
            <span className="mr-1 text-[var(--color-error-500)]">
              *
            </span>
          )}
        </Text>
      )}

      {children}

      {error ? (
        <Text
          variant="caption"
          tone="error"
        >
          {error}
        </Text>
      ) : description ? (
        <Text
          variant="caption"
          tone="secondary"
        >
          {description}
        </Text>
      ) : null}
    </div>
  );
}