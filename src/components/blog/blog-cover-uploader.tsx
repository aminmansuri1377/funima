"use client";

import Image from "next/image";

import { useRef, useState } from "react";

import { FiImage, FiTrash2, FiUploadCloud } from "react-icons/fi";

import { Button, InlineMessage, Text } from "@/components/ui";

type Props = {
  value: string;

  onChange: (value: string) => void;

  disabled?: boolean;
};

export function BlogCoverUploader({
  value,
  onChange,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      formData.append("kind", "cover");

      const response = await fetch("/api/uploads/blog", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        switch (result.error) {
          case "FILE_TOO_LARGE":
            throw new Error("حجم تصویر باید کمتر از ۸ مگابایت باشد.");

          case "INVALID_FILE_TYPE":
            throw new Error("فرمت تصویر معتبر نیست.");

          default:
            throw new Error("آپلود تصویر انجام نشد.");
        }
      }

      if (!result.url || typeof result.url !== "string") {
        throw new Error("آدرس تصویر دریافت نشد.");
      }

      onChange(result.url);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "آپلود تصویر انجام نشد.",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void upload(file);
          }
        }}
      />

      <div>
        <Text variant="label-lg">تصویر کاور</Text>

        <Text variant="caption" tone="secondary" className="mt-1">
          JPG، PNG، WEBP یا AVIF
        </Text>
      </div>

      {value ? (
        <div
          className="
            overflow-hidden
            rounded-xl
            border
            border-(--color-border)
          "
        >
          <div className="relative aspect-16/7">
            <Image
              src={value}
              alt="کاور مقاله"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>

          <div
            className="
              flex flex-wrap
              gap-2
              p-3
            "
          >
            <Button
              type="button"
              size="sm"
              variant="secondary"
              startIcon={<FiImage />}
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              تغییر تصویر
            </Button>

            <Button
              type="button"
              size="sm"
              variant="tertiary"
              startIcon={<FiTrash2 />}
              disabled={disabled || uploading}
              onClick={() => onChange("")}
            >
              حذف کاور
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="
            flex min-h-40
            w-full
            flex-col
            items-center
            justify-center
            rounded-xl
            border-2
            border-dashed
            border-(--color-border)
            bg-(--color-surface)
            p-6
            text-center
            transition-colors
            hover:border-(--color-brand-400)
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          <FiUploadCloud size={28} className="mb-3" />

          <Text variant="label-lg">آپلود تصویر کاور</Text>
        </button>
      )}

      {uploading && (
        <InlineMessage variant="info">در حال آپلود تصویر...</InlineMessage>
      )}

      {error && <InlineMessage variant="error">{error}</InlineMessage>}
    </div>
  );
}
