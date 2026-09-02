import Link from "next/link";

import { redirectAuthenticatedUser } from "@/server/auth/guards";

export default async function AuthPage() {
  await redirectAuthenticatedUser();

  return (
    <main>
      <h1>ورود به فونیما</h1>

      <div>
        <Link href="/auth/visitor">ورود / ثبت نام</Link>
      </div>

      <div>
        <Link href="/auth/host">صاحب کسب و کار هستید؟</Link>
      </div>
    </main>
  );
}
