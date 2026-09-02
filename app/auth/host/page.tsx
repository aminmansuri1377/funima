import { AuthCard } from "@/components/auth/auth-card";

import { AuthHeader } from "@/components/auth/auth-header";

import { AuthShell } from "@/components/auth/auth-shell";

import { IdentityForm } from "@/components/auth/identity-form";

import { FunimaLogo } from "@/components/brand/funima-logo";

import { redirectAuthenticatedUser } from "@/server/auth/guards";

export default async function HostAuthPage() {
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
              title="میزبان شو"
              description="برای شروع، اطلاعات خود را وارد کنید."
              backHref="/auth"
            />

            <IdentityForm role="HOST" />
          </div>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
