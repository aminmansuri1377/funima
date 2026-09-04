"use client";

import Image from "next/image";

import { useCallback, useEffect, useRef, useState } from "react";

import { FiChevronLeft, FiChevronRight, FiImage } from "react-icons/fi";

type ImageSliderItem = {
  id: string;

  url: string;

  alt?: string;
};

type ImageSliderProps = {
  images: ImageSliderItem[];

  alt?: string;

  priority?: boolean;

  className?: string;

  imageClassName?: string;

  aspectClassName?: string;

  showArrows?: boolean;

  showDots?: boolean;

  loop?: boolean;

  fallback?: React.ReactNode;

  onSlideChange?: (index: number) => void;
};

export function ImageSlider({
  images,
  alt = "تصویر",
  priority = false,
  className = "",
  imageClassName = "",
  aspectClassName = "aspect-[4/3] sm:aspect-[16/8]",
  showArrows = true,
  showDots = true,
  loop = true,
  fallback,
  onSlideChange,
}: ImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const [dragOffset, setDragOffset] = useState(0);

  const [dragging, setDragging] = useState(false);

  const startXRef = useRef<number | null>(null);

  const pointerIdRef = useRef<number | null>(null);

  const total = images.length;

  const hasMultiple = total > 1;

  const setSlide = useCallback(
    (nextIndex: number) => {
      if (total === 0) {
        return;
      }

      let resolved = nextIndex;

      if (loop) {
        if (resolved < 0) {
          resolved = total - 1;
        }

        if (resolved >= total) {
          resolved = 0;
        }
      } else {
        resolved = Math.min(Math.max(resolved, 0), total - 1);
      }

      setActiveIndex(resolved);

      onSlideChange?.(resolved);
    },
    [loop, onSlideChange, total],
  );

  const goNext = useCallback(() => {
    setSlide(activeIndex + 1);
  }, [activeIndex, setSlide]);

  const goPrevious = useCallback(() => {
    setSlide(activeIndex - 1);
  }, [activeIndex, setSlide]);

  useEffect(() => {
    if (activeIndex < total) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(Math.max(total - 1, 0));
  }, [activeIndex, total]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!hasMultiple) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    startXRef.current = event.clientX;

    pointerIdRef.current = event.pointerId;

    setDragging(true);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || startXRef.current === null) {
      return;
    }

    const offset = event.clientX - startXRef.current;

    setDragOffset(offset);
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) {
      return;
    }

    const threshold = 50;

    /*
     * حرکت فیزیکی:
     *
     * Drag به چپ:
     * dragOffset منفی
     * → اسلاید بعدی
     *
     * Drag به راست:
     * dragOffset مثبت
     * → اسلاید قبلی
     */
    if (dragOffset < -threshold) {
      goNext();
    } else if (dragOffset > threshold) {
      goPrevious();
    }

    setDragging(false);

    setDragOffset(0);

    startXRef.current = null;

    if (pointerIdRef.current !== null) {
      try {
        event.currentTarget.releasePointerCapture(pointerIdRef.current);
      } catch {
        // pointer ممکن است قبلاً آزاد شده باشد.
      }
    }

    pointerIdRef.current = null;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!hasMultiple) {
      return;
    }

    /*
     * جهت فیزیکی اسلایدر:
     *
     * ArrowLeft → بعدی
     * ArrowRight → قبلی
     */
    if (event.key === "ArrowLeft") {
      event.preventDefault();

      goNext();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();

      goPrevious();
    }
  }

  if (total === 0) {
    return (
      <div
        className={`
          overflow-hidden
          rounded-[28px]
          bg-(--color-brand-50)
          ${className}
        `}
      >
        <div
          className={`
            flex
            items-center
            justify-center
            text-(--color-brand-500)
            ${aspectClassName}
          `}
        >
          {fallback ?? <FiImage size={48} />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-[28px]
        bg-gray-100
        ${className}
      `}
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="گالری تصاویر"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={`
          relative
          select-none
          overflow-hidden
          touch-pan-y
          outline-none
          ${aspectClassName}

          ${dragging ? "cursor-grabbing" : hasMultiple ? "cursor-grab" : ""}
        `}
      >
        {/*
         * نکته اصلی:
         *
         * dir="ltr"
         *
         * این قسمت موتور داخلی slider است
         * و نباید از RTL پروژه تأثیر بگیرد.
         */}
        <div
          dir="ltr"
          className={`
            flex
            h-full
            w-full

            ${dragging ? "" : "transition-transform duration-300 ease-out"}
          `}
          style={{
            transform: `translate3d(calc(-${activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              aria-hidden={activeIndex !== index}
              className="
                  relative
                  h-full
                  min-w-full
                  shrink-0
                "
            >
              <Image
                src={image.url}
                alt={image.alt ?? `${alt} ${index + 1}`}
                fill
                draggable={false}
                priority={priority && index === 0}
                sizes="(max-width:768px) 100vw, 1000px"
                className={`
                    pointer-events-none
                    object-cover
                    ${imageClassName}
                  `}
              />
            </div>
          ))}
        </div>

        {hasMultiple && showArrows && (
          <>
            {/*
             * سمت راست = قبلی
             */}
            <button
              type="button"
              aria-label="تصویر قبلی"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();

                goPrevious();
              }}
              className="
                  absolute
                  right-3
                  top-1/2
                  z-10
                  hidden
                  h-10
                  w-10
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-black/35
                  text-white
                  backdrop-blur
                  transition-colors
                  hover:bg-black/55
                  sm:flex
                "
            >
              <FiChevronRight size={22} />
            </button>

            {/*
             * سمت چپ = بعدی
             */}
            <button
              type="button"
              aria-label="تصویر بعدی"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();

                goNext();
              }}
              className="
                  absolute
                  left-3
                  top-1/2
                  z-10
                  hidden
                  h-10
                  w-10
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-black/35
                  text-white
                  backdrop-blur
                  transition-colors
                  hover:bg-black/55
                  sm:flex
                "
            >
              <FiChevronLeft size={22} />
            </button>
          </>
        )}

        {hasMultiple && showDots && (
          <SliderDots
            count={total}
            activeIndex={activeIndex}
            onChange={setSlide}
          />
        )}
      </div>
    </div>
  );
}

function SliderDots({
  count,
  activeIndex,
  onChange,
}: {
  count: number;

  activeIndex: number;

  onChange: (index: number) => void;
}) {
  return (
    <div
      className="
        absolute
        inset-x-0
        bottom-3
        z-20
        flex
        items-center
        justify-center
      "
    >
      <div
        dir="ltr"
        className="
          flex
          items-center
          gap-1
        "
      >
        {Array.from({
          length: count,
        }).map((_, index) => {
          const active = index === activeIndex;

          return (
            <button
              key={index}
              type="button"
              aria-label={`رفتن به تصویر ${index + 1}`}
              aria-current={active ? "true" : undefined}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();

                onChange(index);
              }}
              className="
                flex
                h-5
                w-5
                items-center
                justify-center
              "
            >
              <span
                className={`
                  block
                  rounded-full
                  bg-white
                  shadow-sm
                  transition-all
                  duration-200

                  ${active ? "h-3 w-3 opacity-100" : "h-2.5 w-2.5 opacity-75"}
                `}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
