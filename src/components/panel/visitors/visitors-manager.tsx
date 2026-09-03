"use client";

import { useState } from "react";

import {
  FiMessageSquare,
  FiSearch,
  FiBookmark,
  FiCalendar,
  FiTrash2,
} from "react-icons/fi";
import Image from "next/image";
import { Button, InlineMessage, Input, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function VisitorsManager() {
  const [search, setSearch] = useState("");

  const visitors = trpc.panel.visitors.list.useQuery({
    search: search.trim() || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="heading-xl">
          بازدیدکنندگان
        </Text>

        <Text tone="secondary" className="mt-1">
          مدیریت کاربران بازدیدکننده فونیما
        </Text>
      </div>

      <div
        className="
          rounded-xl
          border border-(--color-border)
          bg-(--color-surface)
          p-4
        "
      >
        <div className="relative">
          <FiSearch
            className="
              absolute
              right-5 top-1/2
              -translate-y-1/2
              text-(--color-text-secondary)
            "
          />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو با نام یا شماره موبایل..."
            className="pr-12"
          />
        </div>
      </div>

      {visitors.isPending && (
        <Text tone="secondary">در حال دریافت بازدیدکنندگان...</Text>
      )}

      {visitors.error && (
        <InlineMessage variant="error">
          دریافت لیست بازدیدکنندگان با خطا مواجه شد.
        </InlineMessage>
      )}

      {visitors.data && (
        <VisitorsTable
          visitors={visitors.data}
          onChanged={() => visitors.refetch()}
        />
      )}
    </div>
  );
}

type VisitorsTableProps = {
  visitors: Array<{
    id: string;

    user: {
      id: string;
      fullName: string;
      phoneNumber: string;
      profileImage: string | null;

      roles: string[];

      createdAt: Date | string;

      _count: {
        comments: number;
        savedPlaces: number;
        savedEvents: number;
      };
    };
  }>;

  onChanged: () => void | Promise<unknown>;
};

function VisitorsTable({ visitors, onChanged }: VisitorsTableProps) {
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteVisitor = trpc.panel.visitors.delete.useMutation();

  async function handleDelete(visitorId: string, fullName: string) {
    const confirmed = window.confirm(
      `آیا از حذف دسترسی Visitor برای «${fullName}» مطمئن هستید؟`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteVisitor.mutateAsync({
        visitorId,
      });

      await onChanged();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "حذف بازدیدکننده انجام نشد.",
      );
    }
  }

  if (visitors.length === 0) {
    return (
      <div
        className="
          rounded-xl
          border border-dashed
          border-(--color-border)
          bg-(--color-surface)
          p-10 text-center
        "
      >
        <Text variant="heading-md">بازدیدکننده‌ای پیدا نشد</Text>

        <Text tone="secondary" className="mt-2">
          هنوز کاربری ثبت نشده یا نتیجه‌ای برای جستجو وجود ندارد.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deleteError && (
        <InlineMessage variant="error">{deleteError}</InlineMessage>
      )}

      <div
        className="
          overflow-hidden
          rounded-xl
          border border-(--color-border)
          bg-(--color-surface)
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead
              className="
                bg-gray-50
                text-right
              "
            >
              <tr>
                <TableHead>کاربر</TableHead>

                <TableHead>شماره موبایل</TableHead>

                <TableHead>فعالیت</TableHead>

                <TableHead>ذخیره‌ها</TableHead>

                <TableHead>نقش‌ها</TableHead>

                <TableHead>تاریخ عضویت</TableHead>

                <TableHead>عملیات</TableHead>
              </tr>
            </thead>

            <tbody>
              {visitors.map((visitor) => (
                <tr
                  key={visitor.id}
                  className="
                      border-t
                      border-(--color-border)
                    "
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <VisitorAvatar
                        name={visitor.user.fullName}
                        image={visitor.user.profileImage}
                      />

                      <div>
                        <Text variant="label-md">{visitor.user.fullName}</Text>
                      </div>
                    </div>
                  </td>

                  <td dir="ltr" className="px-5 py-4 text-right">
                    {visitor.user.phoneNumber}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FiMessageSquare aria-hidden />

                      <span>{visitor.user._count.comments} کامنت</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="flex items-center gap-2">
                        <FiBookmark />
                        {visitor.user._count.savedPlaces} مکان
                      </span>

                      <span className="flex items-center gap-2">
                        <FiCalendar />
                        {visitor.user._count.savedEvents} رویداد
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">{visitor.user.roles.join("، ")}</td>

                  <td className="px-5 py-4">
                    {formatDate(visitor.user.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <Button
                      variant="tertiary"
                      size="sm"
                      startIcon={<FiTrash2 />}
                      disabled={deleteVisitor.isPending}
                      onClick={() =>
                        handleDelete(visitor.id, visitor.user.fullName)
                      }
                    >
                      حذف
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="
        whitespace-nowrap
        px-5 py-4
        text-sm font-semibold
      "
    >
      {children}
    </th>
  );
}

function VisitorAvatar({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  if (image) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
        <Image
          src={image}
          alt={name}
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
    );
  }

  const firstCharacter = name.trim().charAt(0) || "؟";

  return (
    <div
      className="
        flex h-10 w-10
        items-center justify-center
        rounded-full
        bg-(--color-brand-50)
        font-bold
        text-(--color-brand-600)
      "
      aria-hidden="true"
    >
      {firstCharacter}
    </div>
  );
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
