import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

type AppHeaderProps = {
  className?: string;
  logoHref?: string;
  priority?: boolean;
};

export function AppHeader({
  className,
  logoHref = "/",
  priority = false,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        `
          flex
          w-full
          items-center
          justify-center
          bg-[#EDEDED]
          px-4
          py-6
          sm:py-7
        `,
        className,
      )}
    >
      <Link
        href={logoHref}
        aria-label="فانیما - صفحه اصلی"
        className="
          inline-flex
          items-center
          justify-center
        "
      >
        <Image
          src="/images/enlogo.png"
          alt="Funima"
          width={270}
          height={80}
          priority={priority}
          className="
            h-auto
            w-[180px]
            sm:w-[200px]
          "
        />
      </Link>
    </header>
  );
}
