import { AdminLoginForm } from "@/components/auth/admin-login-form";

import { redirectAuthenticatedUser } from "@/server/auth/guards";

export default async function AdminLoginPage() {
  await redirectAuthenticatedUser();

  return (
    <main>
      <h1>ورود مدیریت</h1>

      <AdminLoginForm />
    </main>
  );
}
