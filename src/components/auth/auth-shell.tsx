import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type AuthShellProps = {
  children: ReactNode;
  className?: string;
};

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <main
      className={cn(
        "min-h-dvh",
        "bg-(--color-page)",
        "px-4 py-8",
        "sm:px-6 sm:py-12",
        className,
      )}
    >
      <div
        className="
          mx-auto flex
          min-h-[calc(100dvh-4rem)]
          w-full max-w-[520px]
          flex-col justify-center
          sm:min-h-[calc(100dvh-6rem)]
        "
      >
        {children}
      </div>
    </main>
  );
}
