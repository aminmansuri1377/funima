import { auth } from "@/auth";

import { LogoutButton } from "@/components/auth/logout-button";
import { Text } from "@/components/ui";

export async function AdminHeader() {
  const session = await auth();

  return (
    <header
      className="
        flex min-h-20 items-center justify-between
        border-b border-(--color-border)
        bg-(--color-surface)
        px-6
      "
    >
      <div>
        <Text variant="heading-md">پنل مدیریت</Text>

        <Text variant="caption" tone="secondary">
          مدیریت کامل فانیما
        </Text>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-left sm:block">
          <Text variant="label-md">{session?.user?.phoneNumber}</Text>

          <Text variant="caption" tone="secondary">
            مدیر
          </Text>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
