"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { AuthCard } from "@/components/auth/auth-card";

import { AuthHeader } from "@/components/auth/auth-header";

import { AuthShell } from "@/components/auth/auth-shell";

import { FunimaLogo } from "@/components/brand/funima-logo";

import { Button, InlineMessage, OTPInput, Text } from "@/components/ui";

import { loginWithOtp, signupWithOtp } from "@/lib/auth/client";

import {
  clearAuthFlow,
  emptyAuthFlow,
  getAuthFlow,
  type AuthFlowState,
} from "@/lib/auth/flow-storage";

import { getRoleHome } from "@/lib/auth/routes";

import { otpCodeSchema } from "@/lib/auth/schemas";

const formSchema = z.object({
  code: otpCodeSchema,
});

type FormInput = z.infer<typeof formSchema>;

export default function OtpPage() {
  const router = useRouter();

  const [authFlow, setAuthFlow] = useState<AuthFlowState>(emptyAuthFlow);

  const [isReady, setIsReady] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      code: "",
    },
  });

  useEffect(() => {
    const storedFlow = getAuthFlow();

    if (!storedFlow.phoneNumber || !storedFlow.role) {
      router.replace("/auth");

      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthFlow(storedFlow);

    setIsReady(true);
  }, [router]);

  const onSubmit = async (values: FormInput) => {
    if (!authFlow.phoneNumber || !authFlow.role) {
      return;
    }

    setServerError(null);

    const result =
      authFlow.role === "ADMIN"
        ? await loginWithOtp({
            phoneNumber: authFlow.phoneNumber,

            code: values.code,

            role: authFlow.role,
          })
        : await signupWithOtp({
            phoneNumber: authFlow.phoneNumber,

            fullName: authFlow.fullName,

            code: values.code,

            role: authFlow.role,
          });

    if (!result.success) {
      setServerError("کد تایید صحیح نیست یا منقضی شده است.");

      return;
    }

    const destination = getRoleHome(authFlow.role);

    clearAuthFlow();

    router.replace(destination);

    router.refresh();
  };

  if (!isReady) {
    return null;
  }

  const backHref =
    authFlow.role === "HOST"
      ? "/auth/host"
      : authFlow.role === "ADMIN"
        ? "/panel/login"
        : "/auth/visitor";

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        {/* Logo */}
        {/* <div className="flex justify-center">
          <FunimaLogo priority />
        </div> */}

        {/* Auth Card */}
        <AuthCard>
          <div className="flex flex-col gap-8">
            {/* Header */}
            <AuthHeader title="کد ۵ رقمی را وارد کنید" backHref={backHref} />

            {/* Description */}
            <div className="text-center">
              <Text variant="body-md" tone="secondary">
                کد ارسال شده به{" "}
                <span
                  dir="ltr"
                  className="
                    inline-block
                    font-semibold
                    text-[var(--color-text-primary)]
                  "
                >
                  {authFlow.phoneNumber}
                </span>{" "}
                را وارد کنید.
              </Text>
            </div>

            {/* OTP Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <Controller
                control={control}
                name="code"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-3">
                    <OTPInput
                      value={field.value ?? ""}
                      onChange={(value) => {
                        field.onChange(value);

                        if (serverError) {
                          setServerError(null);
                        }
                      }}
                      length={5}
                      disabled={isSubmitting}
                      error={Boolean(fieldState.error)}
                    />

                    {fieldState.error && (
                      <InlineMessage variant="error" className="text-center">
                        {fieldState.error.message}
                      </InlineMessage>
                    )}
                  </div>
                )}
              />

              {/* Server Error */}
              {serverError && (
                <InlineMessage variant="error" className="text-center">
                  {serverError}
                </InlineMessage>
              )}

              {/* Submit */}
              <Button type="submit" size="xl" fullWidth loading={isSubmitting}>
                تایید
              </Button>
            </form>

            {/* Expiration */}
            <Text variant="caption" tone="secondary" className="text-center">
              کد تایید تا ۵ دقیقه معتبر است.
            </Text>
          </div>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
