"use client";

import { useEffect, useState } from "react";
import { FiBookmark } from "react-icons/fi";

type Props = {
  saved: boolean;

  loading?: boolean;

  className?: string;

  size?: "sm" | "md";

  onToggle: (nextSaved: boolean) => void | Promise<unknown>;
};

export function FavoriteButton({
  saved,
  loading = false,
  className = "",
  size = "md",
  onToggle,
}: Props) {
  const [optimisticSaved, setOptimisticSaved] = useState(saved);

  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!pending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptimisticSaved(saved);
    }
  }, [saved, pending]);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (loading || pending) {
      return;
    }

    const previous = optimisticSaved;

    const next = !previous;

    setOptimisticSaved(next);

    setPending(true);

    try {
      await onToggle(next);
    } catch (error) {
      /*
       * rollback optimistic UI
       */
      setOptimisticSaved(previous);

      throw error;
    } finally {
      setPending(false);
    }
  }

  const dimension = size === "sm" ? "h-9 w-9 text-base" : "h-11 w-11 text-lg";

  return (
    <button
      type="button"
      aria-label={optimisticSaved ? "حذف از ذخیره‌ها" : "ذخیره"}
      aria-pressed={optimisticSaved}
      disabled={loading || pending}
      onClick={handleClick}
      className={`
        flex
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-white/95
        shadow-sm
        backdrop-blur
        transition-all

        disabled:cursor-not-allowed
        disabled:opacity-60

        ${
          optimisticSaved
            ? "text-(--color-brand-600)"
            : "text-(--color-text-primary)"
        }

        ${dimension}
        ${className}
      `}
    >
      <FiBookmark className={optimisticSaved ? "fill-current" : ""} />
    </button>
  );
}
