"use client";

import { useRouter } from "next/navigation";

import { FiArrowRight } from "react-icons/fi";

import { cn } from "@/lib/cn";

type BackButtonProps = {
  href?: string;

  label?: string;

  className?: string;

  disabled?: boolean;
};

export function BackButton({
  href,

  label = "بازگشت",

  className,

  disabled = false,
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (disabled) {
      return;
    }

    /*
     * اگر route مشخص شده باشد،
     * مستقیم به همان صفحه می‌رویم.
     */
    if (href) {
      router.push(href);

      return;
    }

    /*
     * در حالت عادی دقیقاً به
     * صفحه قبلی Browser برمی‌گردیم.
     */
    router.back();
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={handleBack}
      className={cn(
        `
          inline-flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          border-(--color-border)
          bg-white
          text-xl
          text-(--color-text-primary)
          shadow-sm
          transition

          hover:bg-gray-50

          active:scale-95

          disabled:cursor-not-allowed
          disabled:opacity-50
          disabled:active:scale-100
        `,
        className,
      )}
    >
      <FiArrowRight aria-hidden="true" />
    </button>
  );
}
