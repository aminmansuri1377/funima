import {
  FiUsers,
  FiMapPin,
  FiCalendar,
  FiMessageSquare,
  FiFileText,
} from "react-icons/fi";

import { prisma } from "@/server/db/prisma";

import { StatCard } from "@/components/panel/stat-card";

import { Text } from "@/components/ui";

export default async function AdminDashboardPage() {
  const [
    visitorCount,
    hostCount,
    placeCount,
    eventCount,
    commentCount,
    blogCount,
  ] = await Promise.all([
    prisma.visitor.count(),
    prisma.host.count(),
    prisma.place.count(),
    prisma.event.count(),
    prisma.comment.count(),
    prisma.blog.count(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Text as="h1" variant="heading-xl">
          داشبورد
        </Text>

        <Text tone="secondary" className="mt-2">
          نمای کلی وضعیت فانیما
        </Text>
      </div>

      <section
        className="
          grid gap-4
          sm:grid-cols-2
          xl:grid-cols-3
        "
      >
        <StatCard
          title="بازدیدکنندگان"
          value={visitorCount}
          icon={<FiUsers size={22} />}
        />

        <StatCard
          title="میزبان‌ها"
          value={hostCount}
          icon={<FiUsers size={22} />}
        />

        <StatCard
          title="مکان‌ها"
          value={placeCount}
          icon={<FiMapPin size={22} />}
        />

        <StatCard
          title="رویدادها"
          value={eventCount}
          icon={<FiCalendar size={22} />}
        />

        <StatCard
          title="کامنت‌ها"
          value={commentCount}
          icon={<FiMessageSquare size={22} />}
        />

        <StatCard
          title="بلاگ‌ها"
          value={blogCount}
          icon={<FiFileText size={22} />}
        />
      </section>
    </div>
  );
}
