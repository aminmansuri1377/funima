"use client";

import { useRouter } from "next/navigation";

import { FiArrowRight, FiCheckCircle } from "react-icons/fi";

import { Button, InlineMessage, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

import { HostPlaceStepOne } from "./host-place-step-one";

import { HostPlaceStepTwo } from "./host-place-step-two";

export function HostPlaceOnboarding() {
  const router = useRouter();

  const place = trpc.host.place.getMine.useQuery();

  if (place.isPending) {
    return (
      <OnboardingShell>
        <div className="space-y-4">
          <div
            className="
              h-16
              animate-pulse
              rounded-3xl
              bg-white
            "
          />

          <div
            className="
              h-96
              animate-pulse
              rounded-[28px]
              bg-white
            "
          />

          <Text tone="secondary" className="text-center">
            در حال دریافت اطلاعات...
          </Text>
        </div>
      </OnboardingShell>
    );
  }

  if (place.error) {
    return (
      <OnboardingShell>
        <InlineMessage variant="error">
          دریافت اطلاعات مکان انجام نشد.
        </InlineMessage>
      </OnboardingShell>
    );
  }

  /*
   * هنوز Place ساخته نشده:
   * Step 1
   */
  if (!place.data) {
    return (
      <OnboardingShell>
        <BackHeader onBack={() => router.push("/host")} />

        <HostPlaceStepOne onCreated={() => place.refetch()} />
      </OnboardingShell>
    );
  }

  const completed =
    Boolean(place.data.location) && place.data.images.length >= 3;

  /*
   * Place ساخته شده ولی onboarding
   * هنوز کامل نیست:
   * Step 2
   */
  if (!completed) {
    return (
      <OnboardingShell>
        <BackHeader onBack={() => router.push("/host")} />

        <HostPlaceStepTwo
          place={place.data}
          onCompleted={async () => {
            await place.refetch();

            router.replace("/host");

            router.refresh();
          }}
        />
      </OnboardingShell>
    );
  }

  /*
   * اگر کاربر دستی /host/place/new
   * را باز کند ولی Place کامل داشته باشد.
   */
  return (
    <OnboardingShell>
      <div
        className="
          mx-auto
          max-w-xl
          rounded-[30px]
          bg-white
          px-5
          py-12
          text-center
          shadow-[0_8px_30px_rgba(0,0,0,0.04)]
          sm:px-8
        "
      >
        <div
          className="
            mx-auto
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-[22px]
            bg-(--color-brand-50)
            text-2xl
            text-(--color-brand-600)
          "
        >
          <FiCheckCircle />
        </div>

        <Text variant="heading-md" className="mt-5">
          مکان شما قبلاً تکمیل شده است
        </Text>

        <Text tone="secondary" className="mt-2">
          برای مشاهده یا ویرایش اطلاعات مکان به داشبورد میزبان برگردید.
        </Text>

        <Button
          type="button"
          className="mt-7"
          onClick={() => router.replace("/host")}
        >
          بازگشت به داشبورد
        </Button>
      </div>
    </OnboardingShell>
  );
}

function BackHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="mb-5">
      <button
        type="button"
        aria-label="بازگشت"
        onClick={onBack}
        className="
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
    </div>
  );
}

function OnboardingShell({ children }: { children: React.ReactNode }) {
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
          max-w-4xl
        "
      >
        {children}
      </div>
    </main>
  );
}
