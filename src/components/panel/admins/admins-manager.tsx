"use client";

import Image from "next/image";

import { useState } from "react";

import { FiPlus, FiSearch, FiShield, FiTrash2 } from "react-icons/fi";

import { Button, FormField, InlineMessage, Input, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function AdminsManager() {
  const [search, setSearch] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const admins = trpc.panel.admins.list.useQuery({
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
            مدیران
          </Text>

          <Text tone="secondary" className="mt-1">
            مدیریت دسترسی مدیران فانیما
          </Text>
        </div>

        <Button
          startIcon={<FiPlus />}
          onClick={() => setShowCreateForm((value) => !value)}
        >
          افزودن مدیر
        </Button>
      </div>

      {showCreateForm && (
        <CreateAdminForm
          onCreated={() => {
            setShowCreateForm(false);

            void admins.refetch();
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
              absolute right-5 top-1/2
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

      {admins.isPending && (
        <Text tone="secondary">در حال دریافت مدیران...</Text>
      )}

      {admins.error && (
        <InlineMessage variant="error">
          دریافت لیست مدیران با خطا مواجه شد.
        </InlineMessage>
      )}

      {admins.data && (
        <AdminsTable admins={admins.data} onChanged={() => admins.refetch()} />
      )}
    </div>
  );
}

function CreateAdminForm({ onCreated }: { onCreated: () => void }) {
  const [fullName, setFullName] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");

  const [error, setError] = useState<string | null>(null);

  const createAdmin = trpc.panel.admins.create.useMutation();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    try {
      await createAdmin.mutateAsync({
        fullName,
        phoneNumber,
      });

      setFullName("");
      setPhoneNumber("");

      onCreated();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ایجاد مدیر انجام نشد.",
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
        افزودن مدیر جدید
      </Text>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="نام و نام خانوادگی" required>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="نام مدیر"
            disabled={createAdmin.isPending}
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
            disabled={createAdmin.isPending}
          />
        </FormField>
      </div>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}

      <div className="mt-5">
        <Button
          type="submit"
          loading={createAdmin.isPending}
          startIcon={<FiShield />}
        >
          ایجاد مدیر
        </Button>
      </div>
    </form>
  );
}

type AdminsTableProps = {
  admins: Array<{
    id: string;
    fullName: string;
    phoneNumber: string;
    profileImage: string | null;
    roles: string[];
    createdAt: Date | string;
  }>;

  onChanged: () => void | Promise<unknown>;
};

function AdminsTable({ admins, onChanged }: AdminsTableProps) {
  const [error, setError] = useState<string | null>(null);

  const removeAdmin = trpc.panel.admins.removeRole.useMutation();

  async function handleRemove(userId: string, fullName: string) {
    const confirmed = window.confirm(
      `آیا از حذف دسترسی مدیریت «${fullName}» مطمئن هستید؟`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await removeAdmin.mutateAsync({
        userId,
      });

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "حذف دسترسی مدیریت انجام نشد.",
      );
    }
  }

  return (
    <div className="space-y-3">
      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      <div
        className="
          overflow-hidden
          rounded-xl
          border border-(--color-border)
          bg-(--color-surface)
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 text-right">
              <tr>
                <th className="px-5 py-4">مدیر</th>

                <th className="px-5 py-4">شماره موبایل</th>

                <th className="px-5 py-4">نقش‌ها</th>

                <th className="px-5 py-4">تاریخ عضویت</th>

                <th className="px-5 py-4">عملیات</th>
              </tr>
            </thead>

            <tbody>
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="
                      border-t
                      border-(--color-border)
                    "
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AdminAvatar
                        name={admin.fullName}
                        image={admin.profileImage}
                      />

                      <Text variant="label-md">{admin.fullName}</Text>
                    </div>
                  </td>

                  <td dir="ltr" className="px-5 py-4 text-right">
                    {admin.phoneNumber}
                  </td>

                  <td className="px-5 py-4">{admin.roles.join("، ")}</td>

                  <td className="px-5 py-4">
                    {new Intl.DateTimeFormat("fa-IR").format(
                      new Date(admin.createdAt),
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <Button
                      variant="tertiary"
                      size="sm"
                      startIcon={<FiTrash2 />}
                      disabled={removeAdmin.isPending}
                      onClick={() => handleRemove(admin.id, admin.fullName)}
                    >
                      حذف دسترسی
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

function AdminAvatar({ name, image }: { name: string; image: string | null }) {
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
        items-center justify-center
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
