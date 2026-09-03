"use client";

import { useState } from "react";

import { FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";

import { Button, FormField, InlineMessage, Input, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function HostsManager() {
  const [search, setSearch] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const hosts = trpc.panel.hosts.list.useQuery({
    search: search.trim() || undefined,
  });

  return (
    <div className="space-y-6">
      <div
        className="
          flex flex-col gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            میزبان‌ها
          </Text>

          <Text tone="secondary" className="mt-1">
            مدیریت میزبان‌های فونیما
          </Text>
        </div>

        <Button
          startIcon={<FiPlus />}
          onClick={() => setShowCreateForm((value) => !value)}
        >
          افزودن میزبان
        </Button>
      </div>

      {showCreateForm && (
        <CreateHostForm
          onCreated={() => {
            setShowCreateForm(false);

            void hosts.refetch();
          }}
        />
      )}

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

      {hosts.isPending && (
        <Text tone="secondary">در حال دریافت میزبان‌ها...</Text>
      )}

      {hosts.error && (
        <InlineMessage variant="error">
          دریافت لیست میزبان‌ها با خطا مواجه شد.
        </InlineMessage>
      )}

      {hosts.data && (
        <HostsTable hosts={hosts.data} onChanged={() => hosts.refetch()} />
      )}
    </div>
  );
}

function CreateHostForm({ onCreated }: { onCreated: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState("");

  const [fullName, setFullName] = useState("");

  const [error, setError] = useState<string | null>(null);

  const createHost = trpc.panel.hosts.create.useMutation();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    try {
      await createHost.mutateAsync({
        phoneNumber,
        fullName,
      });

      setPhoneNumber("");
      setFullName("");

      onCreated();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ساخت میزبان انجام نشد.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        rounded-xl
        border border-(--color-border)
        bg-(--color-surface)
        p-5
      "
    >
      <Text variant="heading-md" className="mb-5">
        افزودن میزبان جدید
      </Text>

      <div
        className="
          grid gap-5
          md:grid-cols-2
        "
      >
        <FormField label="نام و نام خانوادگی" required>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="نام میزبان"
            disabled={createHost.isPending}
          />
        </FormField>

        <FormField label="شماره موبایل" required>
          <Input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            type="tel"
            dir="ltr"
            className="text-left"
            placeholder="09123456789"
            disabled={createHost.isPending}
          />
        </FormField>
      </div>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}

      <div className="mt-5">
        <Button type="submit" loading={createHost.isPending}>
          ایجاد میزبان
        </Button>
      </div>
    </form>
  );
}

type HostsTableProps = {
  hosts: Array<{
    id: string;

    user: {
      id: string;
      fullName: string;
      phoneNumber: string;
      roles: string[];
      createdAt: Date | string;
    };

    place: {
      id: string;
      placeName: string;
    } | null;
  }>;

  onChanged: () => void | Promise<unknown>;
};

function HostsTable({ hosts, onChanged }: HostsTableProps) {
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteHost = trpc.panel.hosts.delete.useMutation();

  async function handleDelete(hostId: string, fullName: string) {
    const confirmed = window.confirm(
      `آیا از حذف میزبان «${fullName}» مطمئن هستید؟`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteHost.mutateAsync({
        hostId,
      });

      await onChanged();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "حذف میزبان انجام نشد.",
      );
    }
  }

  if (hosts.length === 0) {
    return (
      <div
        className="
          rounded-xl
          border border-dashed
          border-(--color-border)
          bg-(--color-surface)
          p-10
          text-center
        "
      >
        <Text variant="heading-md">میزبانی پیدا نشد</Text>

        <Text tone="secondary" className="mt-2">
          هنوز میزبان ثبت نشده یا نتیجه‌ای برای جستجو وجود ندارد.
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
          <table className="w-full min-w-[760px]">
            <thead
              className="
                bg-gray-50
                text-right
              "
            >
              <tr>
                <th className="px-5 py-4 text-sm font-semibold">نام</th>

                <th className="px-5 py-4 text-sm font-semibold">
                  شماره موبایل
                </th>

                <th className="px-5 py-4 text-sm font-semibold">مکان</th>

                <th className="px-5 py-4 text-sm font-semibold">نقش‌ها</th>

                <th className="px-5 py-4 text-sm font-semibold">عملیات</th>
              </tr>
            </thead>

            <tbody>
              {hosts.map((host) => (
                <tr
                  key={host.id}
                  className="
                      border-t
                      border-(--color-border)
                    "
                >
                  <td className="px-5 py-4 font-semibold">
                    {host.user.fullName}
                  </td>

                  <td dir="ltr" className="px-5 py-4 text-right">
                    {host.user.phoneNumber}
                  </td>

                  <td className="px-5 py-4">
                    {host.place ? host.place.placeName : "بدون مکان"}
                  </td>

                  <td className="px-5 py-4">{host.user.roles.join("، ")}</td>

                  <td className="px-5 py-4">
                    <Button
                      variant="tertiary"
                      size="sm"
                      startIcon={<FiTrash2 />}
                      disabled={deleteHost.isPending}
                      onClick={() => handleDelete(host.id, host.user.fullName)}
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
