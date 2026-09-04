"use client";

import Image from "next/image";

import { useEffect, useState } from "react";

import { FiActivity, FiSearch } from "react-icons/fi";

import {
  InlineMessage,
  Input,
  Pagination,
  SearchInput,
  Text,
} from "@/components/ui";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { trpc } from "@/trpc/client";

export function AuditLogsManager() {
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(20);

  const [action, setAction] = useState("");

  const [entity, setEntity] = useState("");

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  /*
   * وقتی فیلتر عوض می‌شود
   * باید برگردیم صفحه اول.
   *
   * این effect cascading state
   * روی داده query انجام نمی‌دهد؛
   * فقط state navigation را sync می‌کند.
   */

  const logs = trpc.panel.auditLogs.list.useQuery({
    page,
    pageSize,

    search: debouncedSearch.trim() || undefined,

    action: action || undefined,

    entity: entity || undefined,
  });

  const filterOptions = trpc.panel.auditLogs.filters.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="heading-xl">
          گزارش فعالیت‌ها
        </Text>

        <Text tone="secondary" className="mt-1">
          تاریخچه عملیات مدیران در پنل فونیما
        </Text>
      </div>
      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onDebouncedChange={setDebouncedSearch}
        onClear={() => {
          setSearch("");
          setDebouncedSearch("");
        }}
        placeholder="جستجو..."
      />
      <section
        className="
          grid gap-4
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-4
          lg:grid-cols-[1fr_220px_220px]
        "
      >
        <div className="relative">
          <FiSearch
            className="
              absolute
              right-5
              top-1/2
              -translate-y-1/2
              text-(--color-text-secondary)
            "
          />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو در مدیر، عملیات یا شناسه..."
            className="pr-12"
          />
        </div>

        <select
          value={action}
          onChange={(event) => setAction(event.target.value)}
          className="
            h-14 w-full
            rounded-(--radius-full)
            border
            border-(--color-border-strong)
            bg-white px-4
            outline-none
          "
        >
          <option value="">همه عملیات‌ها</option>

          {filterOptions.data?.actions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={entity}
          onChange={(event) => setEntity(event.target.value)}
          className="
            h-14 w-full
            rounded-(--radius-full)
            border
            border-(--color-border-strong)
            bg-white px-4
            outline-none
          "
        >
          <option value="">همه موجودیت‌ها</option>

          {filterOptions.data?.entities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      {logs.isPending && (
        <Text tone="secondary">در حال دریافت گزارش‌ها...</Text>
      )}

      {logs.error && (
        <InlineMessage variant="error">
          دریافت گزارش فعالیت‌ها انجام نشد.
        </InlineMessage>
      )}

      {logs.data && logs.data.items.length > 0 && (
        <>
          <div
            className="
                overflow-hidden
                rounded-xl
                border
                border-(--color-border)
                bg-(--color-surface)
              "
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead
                  className="
                      bg-gray-50
                      text-right
                    "
                >
                  <tr>
                    <th className="px-5 py-4">مدیر</th>

                    <th className="px-5 py-4">عملیات</th>

                    <th className="px-5 py-4">موجودیت</th>

                    <th className="px-5 py-4">شناسه</th>

                    <th className="px-5 py-4">تاریخ</th>

                    <th className="px-5 py-4">جزئیات</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.data.items.map((log) => (
                    <AuditLogRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={logs.data.pagination.page}
            pageSize={logs.data.pagination.pageSize}
            totalItems={logs.data.pagination.total}
            totalPages={logs.data.pagination.totalPages}
            disabled={logs.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);

              setPage(1);
            }}
          />
        </>
      )}

      {logs.data?.items.length === 0 && (
        <div
          className="
            rounded-xl
            border
            border-dashed
            border-(--color-border)
            bg-(--color-surface)
            p-12
            text-center
          "
        >
          <FiActivity size={32} className="mx-auto mb-3" />

          <Text variant="heading-md">گزارشی پیدا نشد</Text>
        </div>
      )}
    </div>
  );
}

type AuditLogRowProps = {
  log: {
    id: string;
    action: string;
    entity: string;

    entityId: string | null;

    metadata: unknown;

    createdAt: Date | string;

    admin: {
      id: string;
      fullName: string;
      phoneNumber: string;

      profileImage: string | null;
    };
  };
};

function AuditLogRow({ log }: AuditLogRowProps) {
  return (
    <tr
      className="
        border-t
        border-(--color-border)
        align-top
      "
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <AdminAvatar
            name={log.admin.fullName}
            image={log.admin.profileImage}
          />

          <div>
            <Text variant="label-md">{log.admin.fullName}</Text>

            <Text variant="caption" tone="secondary" dir="ltr">
              {log.admin.phoneNumber}
            </Text>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <code
          className="
            rounded-md
            bg-(--color-brand-50)
            px-2 py-1
            text-xs
            text-(--color-brand-700)
          "
        >
          {log.action}
        </code>
      </td>

      <td className="px-5 py-4">{log.entity}</td>

      <td
        dir="ltr"
        className="
          max-w-48
          truncate
          px-5 py-4
          text-left
          text-xs
        "
        title={log.entityId ?? ""}
      >
        {log.entityId ?? "—"}
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        {new Intl.DateTimeFormat("fa-IR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(log.createdAt))}
      </td>

      <td className="max-w-[400px] px-5 py-4">
        <MetadataPreview value={log.metadata} />
      </td>
    </tr>
  );
}

function MetadataPreview({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-sm text-(--color-text-secondary)">—</span>;
  }

  let text: string;

  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }

  return (
    <details>
      <summary
        className="
          cursor-pointer
          text-sm
          text-(--color-brand-600)
        "
      >
        مشاهده جزئیات
      </summary>

      <pre
        dir="ltr"
        className="
          mt-2
          max-h-48
          overflow-auto
          whitespace-pre-wrap
          rounded-lg
          bg-gray-50
          p-3
          text-left
          text-xs
        "
      >
        {text}
      </pre>
    </details>
  );
}

function AdminAvatar({
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

  return (
    <div
      className="
        flex h-10 w-10
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-(--color-brand-50)
        font-bold
        text-(--color-brand-600)
      "
    >
      {name.trim().charAt(0) || "؟"}
    </div>
  );
}
