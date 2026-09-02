import Link from "next/link";

import { FiArrowRight } from "react-icons/fi";

import { IconButton, Text } from "@/components/ui";

type AuthHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
};

export function AuthHeader({ title, description, backHref }: AuthHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="relative flex items-center justify-center">
        {backHref && (
          <Link
            href={backHref}
            className="absolute right-0"
            aria-label="بازگشت"
          >
            <IconButton
              variant="tertiary"
              size="md"
              aria-label="بازگشت"
              tabIndex={-1}
            >
              <FiArrowRight />
            </IconButton>
          </Link>
        )}

        <Text as="h1" variant="heading-lg" className="text-center">
          {title}
        </Text>
      </div>

      {description && (
        <Text variant="body-sm" tone="secondary" className="text-center">
          {description}
        </Text>
      )}
    </header>
  );
}
