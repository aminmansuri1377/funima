import Link from "next/link";

import { FiArrowLeft, FiMapPin } from "react-icons/fi";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";

import { FunimaLogo } from "@/components/brand/funima-logo";

import { BackButton, Button, Divider, Text } from "@/components/ui";

import { redirectAuthenticatedUser } from "@/server/auth/guards";

export default async function AuthPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <div
          className="
            relative
            flex
            min-h-12
            items-center
            justify-center
          "
        >
          <div
            className="
              absolute
              right-0
              top-1/2
              -translate-y-1/2
            "
          >
            <BackButton />
          </div>

          {/* <FunimaLogo priority /> */}
        </div>

        <AuthCard>
          <div className="flex flex-col gap-8">
            <div className="space-y-3 text-center">
              <Text as="h1" variant="heading-xl">
                ماجراجویی‌ات را ادامه بده!
              </Text>

              <Text variant="body-md" tone="secondary">
                برای کشف مکان‌ها و تجربه‌های جدید وارد فانیما شو.
              </Text>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/auth/visitor" className="block">
                <Button fullWidth size="xl">
                  ورود یا ثبت نام
                </Button>
              </Link>
            </div>

            <Divider>صاحب کسب و کار هستید؟</Divider>

            <Link href="/auth/host" className="block">
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                startIcon={<FiMapPin aria-hidden="true" />}
                endIcon={<FiArrowLeft aria-hidden="true" />}
              >
                میزبان شو
              </Button>
            </Link>
          </div>
        </AuthCard>

        <Text variant="caption" tone="secondary" className="text-center">
          با ورود به فانیما، قوانین و شرایط استفاده را می‌پذیرید.
        </Text>
      </div>
    </AuthShell>
  );
}
