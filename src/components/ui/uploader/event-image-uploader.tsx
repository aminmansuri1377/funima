"use client";

import Image from "next/image";

import { useEffect, useMemo, useRef, useState } from "react";

import { FiImage, FiPlus, FiTrash2, FiUploadCloud } from "react-icons/fi";

import { Button, InlineMessage, Text } from "@/components/ui";

import { cn } from "@/lib/cn";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type EventImageItem = {
  id: string;
  url: string;
  sortOrder: number;
};

type EventImagePickerProps = {
  files: File[];

  onChange: (files: File[]) => void;

  maxFiles?: number;
};

export function EventImagePicker({
  files,
  onChange,
  maxFiles = 8,
}: EventImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,

        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [previews]);

  const remaining = Math.max(maxFiles - files.length, 0);

  function addFiles(selected: FileList | File[]) {
    setError(null);

    const incoming = Array.from(selected);

    const accepted: File[] = [];

    for (const file of incoming) {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError("فقط فرمت‌های JPG، PNG، WEBP و AVIF مجاز هستند.");

        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("حجم هر تصویر باید کمتر از ۵ مگابایت باشد.");

        continue;
      }

      accepted.push(file);
    }

    const next = [...files, ...accepted].slice(0, maxFiles);

    onChange(next);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    onChange(files.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-4">
      <div>
        <Text variant="heading-md">تصاویر ایونت</Text>

        <Text variant="body-sm" tone="secondary" className="mt-1">
          اختیاری — حداکثر ۸ تصویر، هر تصویر حداکثر ۵ مگابایت
        </Text>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) {
            addFiles(event.target.files);
          }
        }}
      />

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="
            flex
            min-h-36
            w-full
            flex-col
            items-center
            justify-center
            rounded-[22px]
            border-2
            border-dashed
            border-(--color-border)
            bg-[#fafafa]
            p-6
            text-center
            transition-colors
            hover:border-(--color-brand-400)
            hover:bg-(--color-brand-50)
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-(--color-brand-50)
              text-(--color-brand-500)
            "
          >
            <FiUploadCloud size={24} />
          </div>

          <Text variant="label-lg" className="mt-3">
            اضافه کردن تصویر
          </Text>

          <Text variant="caption" tone="secondary" className="mt-1">
            این قسمت اختیاری است
          </Text>
        </button>
      )}

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {previews.length > 0 && (
        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            lg:grid-cols-4
          "
        >
          {previews.map((preview, index) => (
            <div
              key={`${preview.file.name}-${index}`}
              className="
                  overflow-hidden
                  rounded-[18px]
                  border
                  border-(--color-border)
                  bg-white
                "
            >
              <div className="relative aspect-square">
                <Image
                  src={preview.url}
                  alt={`تصویر ایونت ${index + 1}`}
                  fill
                  unoptimized
                  sizes="25vw"
                  className="object-cover"
                />

                {index === 0 && (
                  <span
                    className="
                        absolute
                        right-2
                        top-2
                        rounded-full
                        bg-black/70
                        px-2
                        py-1
                        text-xs
                        text-white
                      "
                  >
                    تصویر اصلی
                  </span>
                )}
              </div>

              <div className="p-2">
                <Button
                  type="button"
                  size="sm"
                  variant="tertiary"
                  startIcon={<FiTrash2 />}
                  fullWidth
                  onClick={() => removeFile(index)}
                >
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type EventImageUploaderProps = {
  eventId: string;

  images: EventImageItem[];

  onUploaded: () => void | Promise<unknown>;

  onDelete: (imageId: string) => void | Promise<unknown>;

  maxFiles?: number;
};

export function EventImageUploader({
  eventId,
  images,
  onUploaded,
  onDelete,
  maxFiles = 8,
}: EventImageUploaderProps) {
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
      await uploadEventImages(eventId, selected);

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

  return (
    <div className="space-y-4">
      <div>
        <Text variant="heading-md">تصاویر ایونت</Text>

        <Text tone="secondary" variant="body-sm" className="mt-1">
          تصاویر ایونت مستقل از تصاویر مکان هستند و کاملاً اختیاری‌اند.
        </Text>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
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
          onDrop={(event) => {
            event.preventDefault();

            if (!uploading) {
              void uploadFiles(event.dataTransfer.files);
            }
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            "flex min-h-36 cursor-pointer",
            "flex-col items-center justify-center",
            "rounded-[22px]",
            "border-2 border-dashed",
            "border-(--color-border)",
            "bg-[#fafafa]",
            "p-6 text-center",
            "transition-colors",
            "hover:border-(--color-brand-400)",
            "hover:bg-(--color-brand-50)",
          )}
        >
          <FiUploadCloud size={26} className="text-(--color-brand-500)" />

          <Text variant="label-lg" className="mt-3">
            تصاویر را اینجا رها کنید
          </Text>

          <Text variant="caption" tone="secondary" className="mt-1">
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
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            lg:grid-cols-4
          "
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className="
                  overflow-hidden
                  rounded-[18px]
                  border
                  border-(--color-border)
                  bg-white
                "
            >
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={`تصویر ${index + 1} ایونت`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />

                {index === 0 && (
                  <span
                    className="
                        absolute
                        right-2
                        top-2
                        rounded-full
                        bg-black/70
                        px-2
                        py-1
                        text-xs
                        text-white
                      "
                  >
                    تصویر اصلی
                  </span>
                )}
              </div>

              <div
                className="
                    flex
                    items-center
                    justify-between
                    gap-2
                    p-2
                  "
              >
                <span className="flex items-center gap-1 text-sm">
                  <FiImage />

                  {index + 1}
                </span>

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
                flex
                aspect-square
                items-center
                justify-center
                rounded-[18px]
                border-2
                border-dashed
                border-(--color-border)
                text-(--color-text-secondary)
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

export async function uploadEventImages(eventId: string, files: File[]) {
  for (const file of files) {
    const formData = new FormData();

    formData.append("file", file);

    formData.append("eventId", eventId);

    const response = await fetch("/api/uploads/event", {
      method: "POST",

      body: formData,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      switch (result?.error) {
        case "FILE_TOO_LARGE":
          throw new Error("حجم هر تصویر باید کمتر از ۵ مگابایت باشد.");

        case "INVALID_FILE_TYPE":
          throw new Error("فرمت تصویر مجاز نیست.");

        case "FORBIDDEN":
          throw new Error("اجازه آپلود تصویر برای این ایونت را ندارید.");

        case "MAX_IMAGES_REACHED":
          throw new Error("حداکثر ۸ تصویر برای هر ایونت مجاز است.");

        default:
          throw new Error("آپلود تصویر ایونت انجام نشد.");
      }
    }
  }
}
