"use client";

import {
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/cn";

type OTPInputProps = {
  value: string;
  onChange: (
    value: string,
  ) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
};

export function OTPInput({
  value,
  onChange,
  length = 5,
  disabled = false,
  error = false,
}: OTPInputProps) {
  const refs =
    useRef<
      Array<HTMLInputElement | null>
    >([]);

  const digits =
    Array.from(
      { length },
      (_, index) =>
        value[index] ?? "",
    );

  function updateDigit(
    index: number,
    digit: string,
  ) {
    const chars =
      Array.from(
        { length },
        (_, i) =>
          value[i] ?? "",
      );

    chars[index] =
      digit;

    const nextValue =
      chars
        .join("")
        .slice(0, length);

    onChange(nextValue);
  }

  function handleChange(
    index: number,
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const raw =
      event.target.value;

    const digit =
      raw
        .replace(/\D/g, "")
        .slice(-1);

    updateDigit(
      index,
      digit,
    );

    if (
      digit &&
      index <
        length - 1
    ) {
      refs.current[
        index + 1
      ]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    event:
      KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key ===
        "Backspace" &&
      !digits[index] &&
      index > 0
    ) {
      refs.current[
        index - 1
      ]?.focus();
    }
  }

  function handlePaste(
    text: string,
  ) {
    const digitsOnly =
      text
        .replace(/\D/g, "")
        .slice(0, length);

    if (!digitsOnly) {
      return;
    }

    onChange(
      digitsOnly,
    );

    const targetIndex =
      Math.min(
        digitsOnly.length,
        length - 1,
      );

    queueMicrotask(() => {
      refs.current[
        targetIndex
      ]?.focus();
    });
  }

  return (
    <div
      dir="ltr"
      className="
        flex items-center
        justify-center
        gap-3
      "
    >
      {digits.map(
        (
          digit,
          index,
        ) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[
                index
              ] = element;
            }}
            value={digit}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={
              index === 0
                ? "one-time-code"
                : "off"
            }
            maxLength={1}
            aria-label={`رقم ${index + 1} کد تایید`}
            onChange={(
              event,
            ) =>
              handleChange(
                index,
                event,
              )
            }
            onKeyDown={(
              event,
            ) =>
              handleKeyDown(
                index,
                event,
              )
            }
            onPaste={(
              event,
            ) => {
              event.preventDefault();

              handlePaste(
                event.clipboardData.getData(
                  "text",
                ),
              );
            }}
            className={cn(
              "h-14 w-12",
              "rounded-[var(--radius-md)]",
              "border bg-white",
              "text-center text-2xl font-bold",
              "outline-none",
              "transition-colors",
              error
                ? "border-[var(--color-error-500)]"
                : "border-[var(--color-brand-500)]",
              "focus:ring-2",
              "focus:ring-[var(--color-brand-200)]",
              disabled &&
                "cursor-not-allowed bg-[var(--color-gray-100)]",
            )}
          />
        ),
      )}
    </div>
  );
}