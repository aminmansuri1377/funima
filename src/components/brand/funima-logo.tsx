import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

type FunimaLogoProps = {
  className?: string;
  priority?: boolean;
};

export function FunimaLogo({ className, priority = false }: FunimaLogoProps) {
  return (
    <Link
      href="/"
      aria-label="فونیما"
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Image
        src="/images/logo.png"
        alt="فونیما"
        width={160}
        height={64}
        priority={priority}
        className="h-auto w-[140px] object-contain"
      />
    </Link>
  );
}
