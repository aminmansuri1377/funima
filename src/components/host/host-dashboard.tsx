"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FiCalendar, FiMapPin, FiPlus, FiUser } from "react-icons/fi";

import { Button, InlineMessage, Text } from "@/components/ui";

import { LogoutButton } from "@/components/auth/logout-button";

import { trpc } from "@/trpc/client";

import { HostAccountView } from "./host-account-view";

import { HostLatestEvent } from "./host-latest-event";

type HostTab = "account" | "event";

export function HostDashboard() {
  const router = useRouter();

  const [tab, setTab] = useState<HostTab>("account");

  const place = trpc.host.place.getMine.useQuery();

  if (place.isPending) {
    return (
      <HostShell>
        <HostLoading />
      </HostShell>
    );
  }

  if (place.error) {
    return (
      <HostShell>
        <div
          className="
            mx-auto
            max-w-xl
            pt-10
          "
        >
          <InlineMessage variant="error">
            دریافت اطلاعات میزبان انجام نشد.
          </InlineMessage>
        </div>
      </HostShell>
    );
  }

  /*
   * مهم:
   * اگر Host مکان ندارد دیگر
   * onboarding را مستقیم نشان نمی‌دهیم.
   *
   * Host ابتدا Dashboard را می‌بیند.
   */
  if (!place.data) {
    return (
      <HostShell>
        <div className="space-y-5">
          <HostHeader />

          <WelcomeHost />

          <NoPlaceDashboard onCreate={() => router.push("/host/place/new")} />
        </div>
      </HostShell>
    );
  }

  const onboardingComplete =
    Boolean(place.data.location) && place.data.images.length >= 3;

  /*
   * حتی Place ناقص هم دیگر مستقیم
   * Step 2 را نمایش نمی‌دهد.
   *
   * Host داشبورد را می‌بیند و خودش
   * روی ادامه تکمیل کلیک می‌کند.
   */
  if (!onboardingComplete) {
    return (
      <HostShell>
        <div className="space-y-5">
          <HostHeader placeName={place.data.placeName} />

          <IncompletePlaceDashboard
            placeName={place.data.placeName}
            imageCount={place.data.images.length}
            hasLocation={Boolean(place.data.location)}
            onContinue={() => router.push("/host/place/new")}
          />
        </div>
      </HostShell>
    );
  }

  return (
    <HostShell>
      <div
        className="
          space-y-5
          sm:space-y-7
        "
      >
        <HostHeader placeName={place.data.placeName} />

        <HostNavigation tab={tab} onChange={setTab} />

        {tab === "account" ? (
          <HostAccountView
            place={place.data}
            onChanged={() => place.refetch()}
          />
        ) : (
          <HostLatestEvent />
        )}
      </div>
    </HostShell>
  );
}

function WelcomeHost() {
  return (
    <section
      className="
        rounded-[30px]
        bg-(--color-brand-500)
        px-5
        py-7
        text-white
        shadow-[0_12px_35px_rgba(0,0,0,0.08)]
        sm:px-8
        sm:py-9
      "
    >
      <Text as="h1" variant="heading-xl" className="text-white">
        به پنل میزبان فونیما خوش آمدید
      </Text>

      <p
        className="
          mt-3
          max-w-xl
          leading-8
          text-white/80
        "
      >
        از اینجا می‌توانید مکان خود را ثبت کنید، ایونت بسازید و اطلاعات مجموعه
        را مدیریت کنید.
      </p>
    </section>
  );
}

function NoPlaceDashboard({ onCreate }: { onCreate: () => void }) {
  return (
    <section
      className="
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
        <FiMapPin />
      </div>

      <Text variant="heading-md" className="mt-5">
        هنوز مکانی ثبت نکرده‌اید
      </Text>

      <Text
        tone="secondary"
        className="
          mx-auto
          mt-2
          max-w-lg
          leading-7
        "
      >
        برای شروع فعالیت در فونیما، اطلاعات کسب‌وکار خود را ثبت کنید. بعد از
        تکمیل مکان می‌توانید ایونت‌های خود را نیز ایجاد کنید.
      </Text>

      <Button
        type="button"
        size="xl"
        startIcon={<FiPlus />}
        className="mt-7"
        onClick={onCreate}
      >
        اضافه کردن مکان
      </Button>
    </section>
  );
}

function IncompletePlaceDashboard({
  placeName,
  imageCount,
  hasLocation,
  onContinue,
}: {
  placeName: string;

  imageCount: number;

  hasLocation: boolean;

  onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <section
        className="
          rounded-[30px]
          bg-white
          p-5
          shadow-[0_8px_30px_rgba(0,0,0,0.04)]
          sm:p-7
        "
      >
        <div
          className="
            flex
            items-start
            gap-4
          "
        >
          <div
            className="
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              rounded-[20px]
              bg-(--color-brand-50)
              text-xl
              text-(--color-brand-600)
            "
          >
            <FiMapPin />
          </div>

          <div>
            <Text variant="heading-md">{placeName}</Text>

            <Text tone="secondary" className="mt-1">
              ثبت مکان هنوز کامل نشده است.
            </Text>
          </div>
        </div>

        <div
          className="
            mt-6
            grid
            grid-cols-2
            gap-3
          "
        >
          <ProgressItem
            done={imageCount >= 3}
            label="تصاویر"
            detail={`${imageCount.toLocaleString("fa-IR")} از ۳`}
          />

          <ProgressItem
            done={hasLocation}
            label="موقعیت"
            detail={hasLocation ? "تکمیل شده" : "ثبت نشده"}
          />
        </div>

        <Button
          type="button"
          size="xl"
          fullWidth
          className="mt-6"
          onClick={onContinue}
        >
          ادامه تکمیل مکان
        </Button>
      </section>
    </div>
  );
}

function ProgressItem({
  done,
  label,
  detail,
}: {
  done: boolean;

  label: string;

  detail: string;
}) {
  return (
    <div
      className="
        rounded-[20px]
        bg-[#f8f8f8]
        p-4
      "
    >
      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <span
          className={`
            h-2.5
            w-2.5
            rounded-full

            ${done ? "bg-green-500" : "bg-amber-400"}
          `}
        />

        <Text variant="label-md">{label}</Text>
      </div>

      <Text variant="caption" tone="secondary" className="mt-2">
        {detail}
      </Text>
    </div>
  );
}

function HostHeader({ placeName }: { placeName?: string }) {
  return (
    <header
      className="
        flex
        items-center
        justify-between
        gap-4
        rounded-[28px]
        bg-white
        px-4
        py-4
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        sm:px-6
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
        "
      >
        <div
          className="
            relative
            h-11
            w-11
            shrink-0
            overflow-hidden
            rounded-2xl
            bg-(--color-brand-50)
          "
        >
          <Image
            src="/images/logo.png"
            alt="فونیما"
            fill
            sizes="44px"
            priority
            className="object-contain p-1.5"
          />
        </div>

        <div className="min-w-0">
          <Text variant="label-lg">پنل میزبان</Text>

          {placeName && (
            <Text
              variant="caption"
              tone="secondary"
              className="
                mt-0.5
                truncate
              "
            >
              {placeName}
            </Text>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <LogoutButton />
      </div>
    </header>
  );
}

function HostNavigation({
  tab,
  onChange,
}: {
  tab: HostTab;

  onChange: (tab: HostTab) => void;
}) {
  return (
    <nav
      className="
        sticky
        top-3
        z-30
        rounded-[22px]
        border
        border-white/80
        bg-white/90
        p-1.5
        shadow-[0_8px_30px_rgba(0,0,0,0.05)]
        backdrop-blur-xl
      "
    >
      <div
        className="
          grid
          grid-cols-2
          gap-1.5
        "
      >
        <HostTabButton
          active={tab === "account"}
          icon={<FiUser />}
          onClick={() => onChange("account")}
        >
          حساب شما
        </HostTabButton>

        <HostTabButton
          active={tab === "event"}
          icon={<FiCalendar />}
          onClick={() => onChange("event")}
        >
          ایونت شما
        </HostTabButton>
      </div>
    </nav>
  );
}

function HostTabButton({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;

  icon: React.ReactNode;

  children: React.ReactNode;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`
        flex
        min-h-12
        items-center
        justify-center
        gap-2
        rounded-[18px]
        px-3
        text-sm
        font-semibold
        transition-all
        duration-200
        sm:min-h-13
        sm:text-base

        ${
          active
            ? "bg-(--color-brand-500) text-white shadow-sm"
            : "text-(--color-text-secondary) hover:bg-gray-50 hover:text-(--color-text-primary)"
        }
      `}
    >
      <span className="text-lg">{icon}</span>

      {children}
    </button>
  );
}

function HostShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="
        min-h-screen
        bg-[#f5f5f5]
        px-3
        py-3
        sm:px-6
        sm:py-6
        lg:px-8
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-6xl
        "
      >
        {children}
      </div>
    </main>
  );
}

function HostLoading() {
  return (
    <div className="space-y-4">
      <div
        className="
          h-20
          animate-pulse
          rounded-[28px]
          bg-white
        "
      />

      <div
        className="
          h-52
          animate-pulse
          rounded-[30px]
          bg-white
        "
      />

      <Text tone="secondary" className="text-center">
        در حال دریافت اطلاعات حساب...
      </Text>
    </div>
  );
}
