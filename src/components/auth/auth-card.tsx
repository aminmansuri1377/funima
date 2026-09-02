import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <section
      className={cn(
        "w-full",
        "rounded-2xl",
        "bg-(--color-surface)",
        "p-6",
        "shadow-(--shadow-sm)",
        "sm:p-8",
        className,
      )}
    >
      {children}
    </section>
  );
}
