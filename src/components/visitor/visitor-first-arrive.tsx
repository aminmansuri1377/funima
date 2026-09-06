"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";

import { FiChevronLeft } from "react-icons/fi";

import { VisitorPageShell } from "./visitor-page-shell";

export function VisitorFirstArrive() {
  const router = useRouter();

  return (
    <VisitorPageShell maxWidth="content">
      <div
        className="
          flex
          min-h-[calc(100vh-140px)]
          flex-col
          items-center
          justify-between
          gap-10
          py-6
          sm:py-10
        "
      >
        <div
          className="
            flex
            w-full
            flex-1
            flex-col
            items-center
          "
        >
          <div
            className="
              relative
              h-16
              w-[210px]
              sm:h-20
              sm:w-[260px]
            "
          >
            <Image
              src="/images/logo.png"
              alt="Funima"
              fill
              priority
              sizes="260px"
              className="object-contain"
            />
          </div>

          <section
            className="
              mt-24
              w-full
              rounded-[30px]
              bg-white
              px-6
              py-10
              text-center
              shadow-[0_8px_30px_rgba(0,0,0,0.025)]
              sm:mt-28
              sm:px-10
              sm:py-12
            "
          >
            <h1
              className="
                text-2xl
                font-black
                leading-10
                text-(--color-text-primary)
                sm:text-3xl
              "
            >
              ماجراجویی‌ات را ادامه بده!
            </h1>

            <p
              className="
                mx-auto
                mt-4
                max-w-lg
                text-base
                leading-8
                text-(--color-text-secondary)
                sm:text-lg
              "
            >
              برای استفاده از امکانات شخصی فانیما، وارد حساب خود شوید یا یک حساب
              جدید بسازید.
            </p>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => router.push("/auth/visitor")}
                className="
                  flex
                  min-h-14
                  w-full
                  items-center
                  justify-center
                  rounded-full
                  bg-(--color-brand-500)
                  px-6
                  text-lg
                  font-semibold
                  text-white
                  transition-opacity
                  hover:opacity-95
                "
              >
                ورود
              </button>

              <button
                type="button"
                onClick={() => router.push("/auth/visitor")}
                className="
                  flex
                  min-h-14
                  w-full
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-(--color-brand-500)
                  bg-white
                  px-6
                  text-lg
                  font-semibold
                  text-(--color-brand-500)
                  transition-colors
                  hover:bg-(--color-brand-50)
                "
              >
                ثبت نام
              </button>
            </div>
          </section>
        </div>

        <div className="pb-24 text-center sm:pb-28">
          <p
            className="
              text-base
              font-semibold
              text-(--color-text-secondary)
            "
          >
            صاحب کسب و کار هستید؟
          </p>

          <button
            type="button"
            onClick={() => router.push("/auth/host")}
            className="
              mt-3
              inline-flex
              items-center
              gap-1
              text-base
              font-semibold
              text-(--color-brand-500)
            "
          >
            ثبت مکان
            <FiChevronLeft />
          </button>
        </div>
      </div>
    </VisitorPageShell>
  );
}
