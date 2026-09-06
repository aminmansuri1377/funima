"use client";

import { FiExternalLink, FiNavigation } from "react-icons/fi";

import { Button } from "@/components/ui";

type OpenMapButtonProps = {
  latitude: number;
  longitude: number;

  label?: string;
  className?: string;
};

export function OpenMapButton({
  latitude,
  longitude,
  label = "باز کردن در Google Maps",
  className,
}: OpenMapButtonProps) {
  const href = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <Button
        type="button"
        variant="secondary"
        startIcon={<FiNavigation aria-hidden="true" />}
        endIcon={<FiExternalLink aria-hidden="true" />}
      >
        {label}
      </Button>
    </a>
  );
}
