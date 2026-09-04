"use client";

import { useRef } from "react";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { PlaceCard, type VisitorPlaceCardData } from "./place-card";

type Props = {
  places: VisitorPlaceCardData[];

  onSaveChange?: (
    placeId: string,
    nextSaved: boolean,
  ) => void | Promise<unknown>;

  className?: string;
};

export function PlaceCardSlider({
  places,
  onSaveChange,
  className = "",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "next" | "previous") {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const amount = Math.min(element.clientWidth * 0.8, 360);

    element.scrollBy({
      left: direction === "next" ? -amount : amount,

      behavior: "smooth",
    });
  }

  if (places.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        relative
        ${className}
      `}
    >
      <div
        className="
          mb-3
          hidden
          justify-end
          gap-2
          sm:flex
        "
      >
        <SliderButton label="قبلی" onClick={() => scroll("previous")}>
          <FiChevronRight />
        </SliderButton>

        <SliderButton label="بعدی" onClick={() => scroll("next")}>
          <FiChevronLeft />
        </SliderButton>
      </div>

      <div
        ref={scrollRef}
        dir="rtl"
        className="
          -mx-3
          flex
          snap-x
          snap-mandatory
          gap-3
          overflow-x-auto
          px-3
          pb-2
          scrollbar-none
          [&::-webkit-scrollbar]:hidden
          sm:-mx-1
          sm:px-1
        "
      >
        {places.map((place) => (
          <div
            key={place.id}
            className="
                w-[74vw]
                max-w-[290px]
                shrink-0
                snap-start
                sm:w-[280px]
              "
          >
            <PlaceCard place={place} compact onSaveChange={onSaveChange} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SliderButton({
  label,
  onClick,
  children,
}: {
  label: string;

  onClick: () => void;

  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-full
        bg-white
        text-lg
        shadow-sm
        transition-colors
        hover:bg-gray-50
      "
    >
      {children}
    </button>
  );
}
