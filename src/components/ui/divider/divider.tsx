import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type DividerProps = {
  children?: ReactNode;
  className?: string;
};

export function Divider({ children, className }: DividerProps) {
  if (!children) {
    return (
      <div
        role="separator"
        className={cn("h-px w-full", "bg-(--color-border)", className)}
      />
    );
  }

  return (
    <div
      role="separator"
      className={cn("flex w-full items-center gap-4", className)}
    >
      <div className="h-px flex-1 bg-(--color-border)" />

      <span
        className="
          shrink-0
          text-[13px]
          text-(--color-text-secondary)
        "
      >
        {children}
      </span>

      <div className="h-px flex-1 bg-(--color-border)" />
    </div>
  );
}
