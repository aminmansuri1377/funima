import { VisitorBottomNav } from "./visitor-bottom-nav";

type Props = {
  children: React.ReactNode;

  className?: string;

  maxWidth?: "mobile" | "content" | "wide";

  showBottomNav?: boolean;
};

const MAX_WIDTH_CLASSES = {
  mobile: "max-w-[520px]",
  content: "max-w-4xl",
  wide: "max-w-6xl",
} as const;

export function VisitorPageShell({
  children,
  className = "",
  maxWidth = "content",
  showBottomNav = true,
}: Props) {
  return (
    <>
      <main
        className={`
          min-h-screen
          px-3
          pt-4
          sm:px-5
          sm:pt-6

          ${showBottomNav ? "pb-[110px]" : "pb-8"}

          ${className}
        `}
      >
        <div
          className={`
            mx-auto
            w-full
            ${MAX_WIDTH_CLASSES[maxWidth]}
          `}
        >
          {children}
        </div>
      </main>

      {showBottomNav && <VisitorBottomNav />}
    </>
  );
}
