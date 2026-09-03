"use client";

import Image from "next/image";

import { useRef, useState } from "react";

import { FiImage, FiPlus, FiTrash2, FiUploadCloud } from "react-icons/fi";

import { Button, InlineMessage, Text } from "@/components/ui";

import { cn } from "@/lib/cn";

type UploadedImage = {
  id: string;
  url: string;
  sortOrder: number;
};

type ImageUploaderProps = {
  placeId: string;

  images: UploadedImage[];

  onUploaded: () => void | Promise<unknown>;

  onDelete: (imageId: string) => void | Promise<unknown>;

  maxFiles?: number;
};

export function ImageUploader({
  placeId,
  images,
  onUploaded,
  onDelete,
  maxFiles = 8,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(maxFiles - images.length, 0);

  async function uploadFiles(files: FileList | File[]) {
    const selected = Array.from(files).slice(0, remaining);

    if (selected.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (const file of selected) {
        const formData = new FormData();

        formData.append("file", file);

        formData.append("placeId", placeId);

        const response = await fetch("/api/uploads/place", {
          method: "POST",

          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          switch (result.error) {
            case "FILE_TOO_LARGE":
              throw new Error("حجم هر تصویر باید کمتر از ۵ مگابایت باشد.");

            case "INVALID_FILE_TYPE":
              throw new Error("فرمت تصویر مجاز نیست.");

            case "FORBIDDEN":
              throw new Error("اجازه آپلود تصویر برای این مکان را ندارید.");

            default:
              throw new Error("آپلود تصویر انجام نشد.");
          }
        }
      }

      await onUploaded();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "آپلود تصاویر انجام نشد.",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (uploading || remaining <= 0) {
      return;
    }

    void uploadFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      <div>
        <Text variant="heading-md">تصاویر مکان</Text>

        <Text variant="body-sm" tone="secondary" className="mt-1">
          فرمت‌های JPG، PNG، WEBP و AVIF — حداکثر ۵ مگابایت برای هر عکس
        </Text>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="
          image/jpeg,
          image/png,
          image/webp,
          image/avif
        "
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) {
            void uploadFiles(event.target.files);
          }
        }}
      />

      {remaining > 0 && (
        <div
          role="button"
          tabIndex={0}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              inputRef.current?.click();
            }
          }}
          className={cn(
            "flex min-h-40 cursor-pointer",
            "flex-col items-center justify-center",
            "rounded-xl",
            "border-2 border-dashed",
            "border-(--color-border)",
            "bg-(--color-surface)",
            "p-6 text-center",
            "transition-colors",
            "hover:border-(--color-brand-400)",
            "hover:bg-(--color-brand-50)",
          )}
        >
          <div
            className="
              mb-3 flex
              h-12 w-12
              items-center
              justify-center
              rounded-full
              bg-(--color-brand-50)
              text-(--color-brand-500)
            "
          >
            <FiUploadCloud size={24} />
          </div>

          <Text variant="label-lg">تصاویر را اینجا رها کنید</Text>

          <Text variant="caption" tone="secondary" className="mt-1">
            یا برای انتخاب فایل کلیک کنید
          </Text>

          <Text variant="caption" tone="secondary" className="mt-2">
            {remaining} تصویر دیگر می‌توانید اضافه کنید
          </Text>
        </div>
      )}

      {uploading && (
        <InlineMessage variant="info">در حال آپلود تصاویر...</InlineMessage>
      )}

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {images.length > 0 && (
        <div
          className="
            grid grid-cols-2
            gap-4
            sm:grid-cols-3
            lg:grid-cols-4
          "
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className="
                  overflow-hidden
                  rounded-lg
                  border
                  border-(--color-border)
                  bg-(--color-surface)
                "
            >
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={`تصویر ${index + 1} مکان`}
                  fill
                  sizes="
                      (max-width: 640px) 50vw,
                      (max-width: 1024px) 33vw,
                      25vw
                    "
                  className="object-cover"
                />

                {index === 0 && (
                  <span
                    className="
                        absolute right-2 top-2
                        rounded-full
                        bg-black/70
                        px-2 py-1
                        text-xs text-white
                      "
                  >
                    تصویر اصلی
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-1">
                  <FiImage />

                  <Text variant="caption">تصویر {index + 1}</Text>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="tertiary"
                  startIcon={<FiTrash2 />}
                  onClick={() => onDelete(image.id)}
                >
                  حذف
                </Button>
              </div>
            </div>
          ))}

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="
                flex aspect-square
                items-center justify-center
                rounded-lg
                border-2 border-dashed
                border-(--color-border)
                bg-(--color-surface)
                text-(--color-text-secondary)
                transition-colors
                hover:border-(--color-brand-400)
                hover:text-(--color-brand-500)
              "
            >
              <FiPlus size={28} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
