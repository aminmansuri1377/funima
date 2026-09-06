import { AuthCard } from "@/components/auth/auth-card";

import { AuthHeader } from "@/components/auth/auth-header";

import { AuthShell } from "@/components/auth/auth-shell";

import { IdentityForm } from "@/components/auth/identity-form";

import { FunimaLogo } from "@/components/brand/funima-logo";

import { redirectAuthenticatedUser } from "@/server/auth/guards";

export default async function VisitorAuthPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <div className="flex justify-center">
          {/* <FunimaLogo priority /> */}
        </div>

        <AuthCard>
          <div className="flex flex-col gap-8">
            <AuthHeader
              title="ورود"
              description="برای ادامه شماره تماس و نام خود را وارد کنید."
              backHref="/auth"
            />

            <IdentityForm role="VISITOR" />
          </div>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
