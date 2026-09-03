"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  FiActivity,
  FiUsers,
  FiMapPin,
  FiCalendar,
  FiMessageSquare,
  FiFileText,
  FiFilter,
  FiHome,
  FiShield,
} from "react-icons/fi";

import { cn } from "@/lib/cn";

const items = [
  {
    href: "/panel",
    label: "داشبورد",
    icon: FiActivity,
  },
  {
    href: "/panel/visitors",
    label: "بازدیدکنندگان",
    icon: FiUsers,
  },
  {
    href: "/panel/hosts",
    label: "میزبان‌ها",
    icon: FiUsers,
  },
  {
    href: "/panel/admins",
    label: "مدیران",
    icon: FiShield,
  },
  {
    href: "/panel/places",
    label: "مکان‌ها",
    icon: FiMapPin,
  },
  {
    href: "/panel/events",
    label: "رویدادها",
    icon: FiCalendar,
  },
  {
    href: "/panel/comments",
    label: "کامنت‌ها",
    icon: FiMessageSquare,
  },
  {
    href: "/panel/blogs",
    label: "بلاگ‌ها",
    icon: FiFileText,
  },
  {
    href: "/panel/filters",
    label: "فیلترها",
    icon: FiFilter,
  },
  {
    href: "/panel/show-on-page",
    label: "صفحه اصلی",
    icon: FiHome,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        hidden min-h-dvh w-[260px] shrink-0
        border-l border-[var(--color-border)]
        bg-[var(--color-surface)]
        p-5 lg:block
      "
    >
      <div className="mb-8">
        <p className="text-xl font-black text-[var(--color-brand-500)]">
          Funima Admin
        </p>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/panel" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3",
                "text-sm font-semibold transition-colors",
                active
                  ? "bg-[var(--color-brand-50)] text-[var(--color-brand-600)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-50)] hover:text-[var(--color-text-primary)]",
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
