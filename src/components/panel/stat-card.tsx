import type { ReactNode } from "react";

import { Text } from "@/components/ui";

type StatCardProps = {
  title: string;
  value: number | string;
  icon?: ReactNode;
};

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div
      className="
        rounded-xl
        border border-(--color-border)
        bg-(--color-surface)
        p-5
        shadow-(--shadow-sm)
      "
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <Text variant="body-sm" tone="secondary">
            {title}
          </Text>

          <Text variant="heading-xl" className="mt-2">
            {value}
          </Text>
        </div>

        {icon && (
          <div
            className="
              flex h-12 w-12 items-center justify-center
              rounded-full
              bg-[var(--color-brand-50)]
              text-[var(--color-brand-500)]
            "
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
