"use client";

import Image from "next/image";

import { useRef, useState } from "react";

import { FiLoader, FiPlus, FiUser } from "react-icons/fi";

type ProfileImageSize = "host" | "visitor";

type ProfileImageFallback = "initial" | "user";

type ButtonSide = "left" | "right";

type Props = {
  name: string;

  image: string | null;

  size?: ProfileImageSize;

  fallback?: ProfileImageFallback;

  buttonSide?: ButtonSide;

  priority?: boolean;

  onUploaded?: (profileImage: string) => void | Promise<void>;
};

type UploadResponse = {
  success?: boolean;

  profileImage?: string;

  error?: string;

  message?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export function ProfileImageUploader({
  name,

  image,

  size = "visitor",

  fallback = "user",

  buttonSide = "right",

  priority = false,

  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const displayedImage = uploadedImage ?? image;

  const avatarClassName =
    size === "host" ? "h-[76px] w-[76px]" : "h-[92px] w-[92px]";

  const imageSizes = size === "host" ? "76px" : "92px";

  const fallbackTextSize = size === "host" ? "text-[26px]" : "text-[32px]";

  const buttonPosition =
    buttonSide === "left" ? "-bottom-1 -left-1" : "-bottom-1 right-0";

  function openPicker() {
    if (uploading) {
      return;
    }

    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    /*
     * ========================================
     * CLIENT VALIDATION
     * ========================================
     */

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("فرمت تصویر باید JPG، PNG، WebP یا AVIF باشد.");

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");

      return;
    }

    setError(null);

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/uploads/profile", {
        method: "POST",

        body: formData,
      });

      const result = (await response
        .json()
        .catch(() => null)) as UploadResponse | null;

      if (!response.ok || !result?.success || !result.profileImage) {
        throw new Error(result?.message || "آپلود تصویر پروفایل انجام نشد.");
      }

      /*
       * بلافاصله تصویر جدید را در UI
       * نشان می‌دهیم.
       */

      setUploadedImage(result.profileImage);

      /*
       * Parent می‌تواند query خودش را
       * دوباره fetch کند.
       */

      if (onUploaded) {
        await onUploaded(result.profileImage);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "آپلود تصویر پروفایل انجام نشد.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    /*
     * اجازه می‌دهیم کاربر دوباره
     * همان فایل را انتخاب کند.
     */

    event.target.value = "";

    if (!file) {
      return;
    }

    await handleFile(file);
  }

  return (
    <div
      className="
        flex
        flex-col
        items-center
      "
    >
      <div
        className={`
          relative
          ${avatarClassName}
        `}
      >
        {/*
         * ========================================
         * AVATAR
         * ========================================
         */}

        <div
          className="
            relative
            h-full
            w-full
            overflow-hidden
            rounded-full
            bg-white
          "
        >
          {displayedImage ? (
            <Image
              src={displayedImage}
              alt={name}
              fill
              priority={priority}
              sizes={imageSizes}
              className="object-cover"
            />
          ) : fallback === "initial" ? (
            <div
              className={`
                flex
                h-full
                w-full
                items-center
                justify-center
                bg-white
                font-black
                text-[#ff6437]

                ${fallbackTextSize}
              `}
            >
              {name.trim().charAt(0) || "ف"}
            </div>
          ) : (
            <div
              className={`
                flex
                h-full
                w-full
                items-center
                justify-center
                bg-white
                text-[#ff6437]

                ${fallbackTextSize}
              `}
            >
              <FiUser />
            </div>
          )}
        </div>

        {/*
         * ========================================
         * FILE INPUT
         * ========================================
         */}

        <input
          ref={inputRef}
          type="file"
          accept="
            image/jpeg,
            image/png,
            image/webp,
            image/avif
          "
          className="hidden"
          onChange={handleChange}
        />

        {/*
         * ========================================
         * PLUS BUTTON
         * ========================================
         */}

        <button
          type="button"
          aria-label={
            displayedImage ? "تغییر تصویر پروفایل" : "افزودن تصویر پروفایل"
          }
          title={
            displayedImage ? "تغییر تصویر پروفایل" : "افزودن تصویر پروفایل"
          }
          disabled={uploading}
          onClick={openPicker}
          className={`
            absolute
            z-10
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            border-2
            border-[#EDEDED]
            bg-white
            text-[15px]
            text-[#ff6437]
            shadow-sm
            transition-transform

            hover:scale-105

            disabled:cursor-not-allowed
            disabled:opacity-70

            ${buttonPosition}
          `}
        >
          {uploading ? (
            <FiLoader
              className="
                animate-spin
              "
            />
          ) : (
            <FiPlus />
          )}
        </button>
      </div>

      {/*
       * ========================================
       * ERROR
       * ========================================
       */}

      {error && (
        <p
          role="alert"
          className="
            mt-2
            max-w-[220px]
            text-center
            text-[11px]
            leading-5
            text-red-500
          "
        >
          {error}
        </p>
      )}
    </div>
  );
}
