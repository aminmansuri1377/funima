"use client";

import { usePathname, useRouter } from "next/navigation";

import { FiHome, FiUser } from "react-icons/fi";

import { FaFire } from "react-icons/fa";
import { RiFireLine } from "react-icons/ri";

type VisitorNavKey = "profile" | "home" | "events";

type VisitorNavItem = {
  key: VisitorNavKey;

  label: string;

  href: string;

  icon: React.ReactNode;
};

const NAV_ITEMS: VisitorNavItem[] = [
  {
    key: "profile",

    label: "پروفایل",

    href: "/profile",

    icon: <FiUser />,
  },

  {
    key: "home",

    label: "خانه",

    href: "/",

    icon: <FiHome />,
  },

  {
    key: "events",

    label: "ایونت‌ها",

    href: "/events",

    icon: <RiFireLine />,
  },
];

export function VisitorBottomNav() {
  const router = useRouter();

  const pathname = usePathname();

  const activeKey = getActiveNavKey(pathname);

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="
        pointer-events-none
        fixed
        inset-x-0
        bottom-0
        z-50
        px-3
        pb-[max(10px,env(safe-area-inset-bottom))]
        pt-2
      "
    >
      <div
        className="
          pointer-events-auto
          mx-auto
          grid
          w-full
          max-w-[430px]
          grid-cols-3
          rounded-[26px]
          border
          border-black/5
          bg-white/95
          p-1.5
          shadow-[0_-8px_35px_rgba(0,0,0,0.08)]
          backdrop-blur-xl
        "
      >
        {NAV_ITEMS.map((item) => {
          const active = activeKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => router.push(item.href)}
              className="
                flex
                min-h-14
                flex-col
                items-center
                justify-center
                gap-1
                rounded-[20px]
                px-2
                text-xs
                font-semibold
                transition-colors
                duration-200
              "
            >
              <span
                className={`
                  text-3xl
                  transition-colors
                  duration-200

                  ${
                    active
                      ? "text-(--color-brand-500)"
                      : "text-(--color-text-secondary)"
                  }
                `}
              >
                {item.icon}
              </span>

              {/* <span
                className={`
                  transition-colors
                  duration-200

                  ${
                    active
                      ? "text-(--color-brand-500)"
                      : "text-(--color-text-secondary)"
                  }
                `}
              >
                {item.label}
              </span> */}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function getActiveNavKey(pathname: string): VisitorNavKey {
  /*
   * ========================================
   * EVENT SECTION
   * ========================================
   *
   * /events
   * /events/123
   * /events/123/anything
   *
   * همگی Fire را active می‌کنند.
   */
  if (pathname === "/events" || pathname.startsWith("/events/")) {
    return "events";
  }

  /*
   * ========================================
   * PROFILE SECTION
   * ========================================
   *
   * /profile
   * /profile/saved
   * /profile/comments
   * ...
   *
   * همگی Profile را active می‌کنند.
   */
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return "profile";
  }

  /*
   * ========================================
   * HOME / PLACES SECTION
   * ========================================
   *
   * /
   * /places
   * /places/123
   * /places/123/...
   *
   * صفحات مکان بخشی از Home هستند،
   * بنابراین Home باید همچنان active باشد.
   */
  if (
    pathname === "/" ||
    pathname === "/places" ||
    pathname.startsWith("/places/")
  ) {
    return "home";
  }

  /*
   * هر صفحه Visitor دیگری که فعلاً
   * به section خاصی تعلق ندارد،
   * Home را active نگه می‌داریم.
   */
  return "home";
}
