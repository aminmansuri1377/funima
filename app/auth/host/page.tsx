import Link from "next/link";

import { IdentityForm } from "@/components/auth/identity-form";

import { redirectAuthenticatedUser } from "@/server/auth/guards";

export default async function HostAuthPage() {
  await redirectAuthenticatedUser();

  return (
    <main>
      <h1>ثبت مکان</h1>

      <p>برای ورود یا ثبت کسب و کار اطلاعات خود را وارد کنید.</p>

      <IdentityForm role="HOST" />

      <Link href="/auth">بازگشت</Link>
    </main>
  );
}
