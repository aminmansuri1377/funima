import { AdminLoginForm } from "@/components/auth/admin-login-form";

import { AuthCard } from "@/components/auth/auth-card";

import { AuthHeader } from "@/components/auth/auth-header";

import { AuthShell } from "@/components/auth/auth-shell";

import { FunimaLogo } from "@/components/brand/funima-logo";

import { redirectAuthenticatedUser } from "@/server/auth/guards";

export default async function AdminLoginPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <div className="flex justify-center">
          <FunimaLogo priority />
        </div>

        <AuthCard>
          <div className="flex flex-col gap-8">
            <AuthHeader
              title="ورود مدیریت"
              description="برای ورود به پنل مدیریت، شماره موبایل مدیر را وارد کنید."
              backHref="/auth"
            />

            <AdminLoginForm />
          </div>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
