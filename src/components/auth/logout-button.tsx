"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { logout } from "@/lib/auth/client";
import { clearAuthFlow } from "@/lib/auth/flow-storage";
export function LogoutButton() {
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      await logout();

      clearAuthFlow();
      router.replace("/");

      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={isPending}>
      {isPending ? "در حال خروج..." : "خروج"}
    </button>
  );
}
