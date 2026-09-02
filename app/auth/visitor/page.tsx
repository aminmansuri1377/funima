import Link from "next/link";

import { IdentityForm } from "@/components/auth/identity-form";

import { redirectAuthenticatedUser } from "@/server/auth/guards";

export default async function VisitorAuthPage() {
  await redirectAuthenticatedUser();

  return (
    <main>
      <h1>ورود / ثبت نام</h1>

      <p>شماره موبایل و نام و نام خانوادگی خود را وارد کنید.</p>

      <IdentityForm role="VISITOR" />

      <Link href="/auth">بازگشت</Link>
    </main>
  );
}
