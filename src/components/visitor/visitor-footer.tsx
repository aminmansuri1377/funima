import Image from "next/image";

import { Text } from "@/components/ui";

export function VisitorFooter() {
  return (
    <footer
      className="
        mt-12
        border-t
        border-(--color-border)
        py-8
      "
    >
      <div
        className="
          flex
          flex-col
          items-center
          justify-between
          gap-5
          text-center
          sm:flex-row
          sm:text-right
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              relative
              h-10
              w-10
              overflow-hidden
              rounded-xl
            "
          >
            <Image
              src="/images/logo.png"
              alt="فانیما"
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>

          <div>
            <Text variant="label-lg">فانیما</Text>

            <Text variant="caption" tone="secondary">
              پیدا کردن تجربه‌های جذاب اطراف شما
            </Text>
          </div>
        </div>

        <Text variant="caption" tone="secondary">
          © {new Date().getFullYear()} Funima
        </Text>
      </div>
    </footer>
  );
}
