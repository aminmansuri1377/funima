"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { Button, FormField, InlineMessage, Input } from "@/components/ui";

import { saveAuthFlow } from "@/lib/auth/flow-storage";

import type { AuthRole } from "@/lib/auth/roles";

import { fullNameSchema, phoneNumberSchema } from "@/lib/auth/schemas";

import { trpc } from "@/trpc/client";

const formSchema = z.object({
  phoneNumber: phoneNumberSchema,
  fullName: fullNameSchema,
});

type FormInput = z.infer<typeof formSchema>;

type IdentityFormProps = {
  role: Extract<AuthRole, "VISITOR" | "HOST">;
};

export function IdentityForm({ role }: IdentityFormProps) {
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);

  const requestOtp = trpc.auth.requestOtp.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      phoneNumber: "",
      fullName: "",
    },
  });

  const onSubmit = async (values: FormInput) => {
    setServerError(null);

    try {
      const result = await requestOtp.mutateAsync({
        phoneNumber: values.phoneNumber.trim(),
      });

      if (!result.success) {
        if (result.reason === "OTP_COOLDOWN") {
          setServerError(
            `لطفاً ${result.retryAfterSeconds} ثانیه دیگر دوباره تلاش کنید.`,
          );

          return;
        }

        if (result.reason === "TOO_MANY_OTP_REQUESTS") {
          setServerError("تعداد درخواست‌های کد تایید بیش از حد مجاز است.");

          return;
        }

        setServerError("ارسال کد تایید انجام نشد.");

        return;
      }

      saveAuthFlow({
        phoneNumber: values.phoneNumber.trim(),

        fullName: values.fullName.trim(),

        role,
      });

      router.push("/auth/otp");
    } catch (error) {
      console.error("[IdentityForm] requestOtp failed:", error);

      setServerError("خطایی رخ داد. دوباره تلاش کنید.");
    }
  };

  const isLoading = isSubmitting || requestOtp.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField
        label="شماره تماس"
        required
        error={errors.phoneNumber?.message}
      >
        <Input
          {...register("phoneNumber")}
          state={errors.phoneNumber ? "error" : "default"}
          type="tel"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          placeholder="09123456789"
          className="text-left"
          disabled={isLoading}
        />
      </FormField>

      <FormField
        label="نام و نام خانوادگی"
        required
        error={errors.fullName?.message}
      >
        <Input
          {...register("fullName")}
          state={errors.fullName ? "error" : "default"}
          type="text"
          autoComplete="name"
          placeholder="نام و نام خانوادگی"
          disabled={isLoading}
        />
      </FormField>

      {serverError && (
        <InlineMessage variant="error">{serverError}</InlineMessage>
      )}

      <Button
        type="submit"
        size="xl"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
      >
        ادامه
      </Button>
    </form>
  );
}
