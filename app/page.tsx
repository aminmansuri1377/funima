import Link from "next/link";

import { auth } from "@/auth";

import { LogoutButton } from "@/components/auth/logout-button";

export default async function HomePage() {
  const session = await auth();

  return (
    <main>
      <h1>Funima</h1>

      {session?.user ? (
        <>
          <p>ورود با نقش: {session.user.activeRole}</p>

          <p>شماره: {session.user.phoneNumber}</p>

          <p>نقش‌های حساب: {session.user.roles.join(", ")}</p>

          <LogoutButton />
        </>
      ) : (
        <Link href="/auth">ورود / ثبت نام</Link>
      )}
    </main>
  );
}
