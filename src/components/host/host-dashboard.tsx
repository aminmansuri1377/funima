"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FiMapPin, FiPlus } from "react-icons/fi";

import { LogoutButton } from "@/components/auth/logout-button";

import { ProfileImageUploader } from "@/components/profile/profile-image-uploader";

import { Button, InlineMessage, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

import { HostAccountView } from "./host-account-view";
import { HostLatestEvent } from "./host-latest-event";

type HostTab = "account" | "event";

export function HostDashboard() {
  const router = useRouter();

  const [tab, setTab] = useState<HostTab>("account");

  /*
   * getMine:
   * اطلاعات کامل Place
   */
  const place = trpc.host.place.getMine.useQuery();

  /*
   * overview:
   * اطلاعات Host حتی اگر هنوز Place
   * نداشته باشد.
   */
  const overview = trpc.host.place.overview.useQuery();

  /*
   * ========================================
   * PROFILE IMAGE REFRESH
   * ========================================
   */

  async function handleProfileImageChanged() {
    await Promise.all([overview.refetch(), place.refetch()]);
  }

  /*
   * ========================================
   * LOADING
   * ========================================
   */

  if (place.isPending || overview.isPending) {
    return (
      <HostShell>
        <HostLoading />
      </HostShell>
    );
  }

  /*
   * ========================================
   * ERROR
   * ========================================
   */

  if (place.error || overview.error || !overview.data) {
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

  const hostUser = overview.data.host.user;

  /*
   * ========================================
   * HOST WITHOUT PLACE
   * ========================================
   */

  if (!place.data) {
    return (
      <HostShell>
        <div className="space-y-8">
          <HostProfileHeader
            fullName={hostUser.fullName}
            profileImage={hostUser.profileImage}
            onProfileImageChanged={handleProfileImageChanged}
          />

          <WelcomeHost />

          <NoPlaceDashboard onCreate={() => router.push("/host/place/new")} />
        </div>
      </HostShell>
    );
  }

  const onboardingComplete =
    Boolean(place.data.location) && place.data.images.length >= 3;

  /*
   * ========================================
   * INCOMPLETE PLACE
   * ========================================
   */

  if (!onboardingComplete) {
    return (
      <HostShell>
        <div className="space-y-8">
          <HostProfileHeader
            fullName={hostUser.fullName}
            profileImage={hostUser.profileImage}
            onProfileImageChanged={handleProfileImageChanged}
          />

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

  /*
   * ========================================
   * COMPLETE DASHBOARD
   * ========================================
   */

  return (
    <HostShell>
      <div>
        <HostProfileHeader
          fullName={hostUser.fullName}
          profileImage={hostUser.profileImage}
          onProfileImageChanged={handleProfileImageChanged}
        />

        <HostNavigation tab={tab} onChange={setTab} />

        <div className="mt-7">
          {tab === "account" ? (
            <HostAccountView
              place={place.data}
              onChanged={() => place.refetch()}
            />
          ) : (
            <HostLatestEvent />
          )}
        </div>
      </div>
    </HostShell>
  );
}

/* =====================================================
 * PROFILE HEADER
 * ===================================================== */

function HostProfileHeader({
  fullName,
  profileImage,
  onProfileImageChanged,
}: {
  fullName: string;

  profileImage: string | null;

  onProfileImageChanged: () => void | Promise<void>;
}) {
  return (
    <section
      className="
        flex
        flex-col
        items-center
        justify-center
        pb-1
        text-center
      "
    >
      <ProfileImageUploader
        name={fullName}
        image={profileImage}
        size="host"
        fallback="initial"
        buttonSide="left"
        priority
        onUploaded={onProfileImageChanged}
      />

      <Text
        as="h1"
        className="
          mt-4
          text-[19px]
          font-black
          leading-8
          text-[#0b1422]

          sm:text-[21px]
        "
      >
        {fullName}
      </Text>

      <div
        className="
          mt-2
          text-[#9b9b9b]

          [&>button]:text-[12px]
          [&>button]:transition-colors

          hover:[&>button]:text-red-500
        "
      >
        <LogoutButton />
      </div>
    </section>
  );
}

/* =====================================================
 * NAVIGATION
 * ===================================================== */

function HostNavigation({
  tab,
  onChange,
}: {
  tab: HostTab;

  onChange: (tab: HostTab) => void;
}) {
  return (
    <nav
      aria-label="بخش‌های پنل میزبان"
      className="
        mt-6
        flex
        items-end
        justify-center
        gap-12
      "
    >
      <HostTabButton
        active={tab === "account"}
        onClick={() => onChange("account")}
      >
        حساب شما
      </HostTabButton>

      <HostTabButton active={tab === "event"} onClick={() => onChange("event")}>
        ایونت های شما
      </HostTabButton>
    </nav>
  );
}

function HostTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;

  children: React.ReactNode;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`
        relative
        min-h-11
        px-1
        pb-3
        text-[14px]
        font-semibold
        transition-colors

        sm:text-[15px]

        ${
          active
            ? `
              text-[#ff6437]
            `
            : `
              text-[#8e939a]
              hover:text-[#555b63]
            `
        }
      `}
    >
      {children}

      {active && (
        <span
          className="
            absolute
            inset-x-0
            bottom-0
            h-[2px]
            rounded-full
            bg-[#ff6437]
          "
        />
      )}
    </button>
  );
}

/* =====================================================
 * WELCOME
 * ===================================================== */

function WelcomeHost() {
  return (
    <section
      className="
        rounded-[28px]
        bg-white
        px-5
        py-7
        text-center

        sm:px-8
        sm:py-9
      "
    >
      <Text as="h1" variant="heading-xl">
        به پنل میزبان فانیما خوش آمدید
      </Text>

      <Text
        tone="secondary"
        className="
          mx-auto
          mt-3
          max-w-xl
          leading-8
        "
      >
        از اینجا می‌توانید مکان خود را ثبت کنید، ایونت بسازید و اطلاعات مجموعه
        را مدیریت کنید.
      </Text>
    </section>
  );
}

/* =====================================================
 * NO PLACE
 * ===================================================== */

function NoPlaceDashboard({ onCreate }: { onCreate: () => void }) {
  return (
    <section
      className="
        rounded-[28px]
        bg-white
        px-5
        py-12
        text-center

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
          rounded-full
          bg-[#fff4ef]
          text-2xl
          text-[#ff6437]
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
        برای شروع فعالیت در فانیما، اطلاعات کسب‌وکار خود را ثبت کنید.
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

/* =====================================================
 * INCOMPLETE PLACE
 * ===================================================== */

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
    <section
      className="
        rounded-[28px]
        bg-white
        p-5

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
            rounded-full
            bg-[#fff4ef]
            text-xl
            text-[#ff6437]
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
        bg-[#f7f7f7]
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

/* =====================================================
 * SHELL
 * ===================================================== */

function HostShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="
        min-h-screen
        bg-[#EDEDED]
        px-4
        pb-20
        pt-1

        sm:px-6
        sm:pb-24
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[620px]
        "
      >
        {children}
      </div>
    </main>
  );
}

/* =====================================================
 * LOADING
 * ===================================================== */

function HostLoading() {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        pt-3
      "
    >
      <div
        className="
          h-[76px]
          w-[76px]
          animate-pulse
          rounded-full
          bg-white
        "
      />

      <div
        className="
          mt-4
          h-6
          w-28
          animate-pulse
          rounded
          bg-gray-200
        "
      />

      <div
        className="
          mt-7
          flex
          gap-10
        "
      >
        <div
          className="
            h-8
            w-20
            animate-pulse
            rounded
            bg-gray-200
          "
        />

        <div
          className="
            h-8
            w-24
            animate-pulse
            rounded
            bg-gray-200
          "
        />
      </div>

      <Text tone="secondary" className="mt-7">
        در حال دریافت اطلاعات حساب...
      </Text>
    </div>
  );
}
