"use client";

import { useRouter } from "next/navigation";

import { FiArrowRight } from "react-icons/fi";

import { HostEventsList } from "./host-events-list";

export function HostEventsPage() {
  const router = useRouter();

  return (
    <main
      className="
        min-h-screen
        bg-[#f5f5f5]
        px-3
        py-4
        sm:px-6
        sm:py-7
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-6xl
        "
      >
        <button
          type="button"
          aria-label="بازگشت"
          onClick={() => router.push("/host")}
          className="
            mb-5
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            bg-white
            text-xl
            shadow-sm
            transition-colors
            hover:bg-gray-50
          "
        >
          <FiArrowRight />
        </button>

        <HostEventsList />
      </div>
    </main>
  );
}
