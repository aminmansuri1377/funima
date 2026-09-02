import type { ReactNode } from "react";

import { Text } from "@/components/ui/typography";

import { cn } from "@/lib/cn";

type FormFieldProps = {
  label?: string;
  description?: string;

  error?: string;
  success?: string;

  required?: boolean;

  children: ReactNode;

  className?: string;
};

export function FormField({
  label,
  description,
  error,
  success,
  required = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {label && (
        <div className="flex items-center gap-1">
          <Text as="label" variant="label-md">
            {label}
          </Text>

          {required && (
            <span
              aria-hidden="true"
              className="
                text-[var(--color-error-500)]
              "
            >
              *
            </span>
          )}
        </div>
      )}

      {children}

      {error ? (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      ) : success ? (
        <Text variant="caption" tone="success">
          {success}
        </Text>
      ) : description ? (
        <Text variant="caption" tone="secondary">
          {description}
        </Text>
      ) : null}
    </div>
  );
}
