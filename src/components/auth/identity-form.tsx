"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { saveAuthFlow } from "@/lib/auth/flow-storage";
import type { AuthRole } from "@/lib/auth/roles";
import { fullNameSchema, phoneNumberSchema } from "@/lib/auth/schemas";

import { trpc } from "@/trpc/client";

import { z } from "zod";

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

  //   const setAuthFlow = useSetRecoilState(authFlowState);

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
        phoneNumber: values.phoneNumber,
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
    } catch {
      setServerError("خطایی رخ داد. دوباره تلاش کنید.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>شماره موبایل</label>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          {...register("phoneNumber")}
        />

        {errors.phoneNumber && <p>{errors.phoneNumber.message}</p>}
      </div>

      <div>
        <label>نام و نام خانوادگی</label>

        <input type="text" autoComplete="name" {...register("fullName")} />

        {errors.fullName && <p>{errors.fullName.message}</p>}
      </div>

      {serverError && <p>{serverError}</p>}

      <button type="submit" disabled={isSubmitting || requestOtp.isPending}>
        {requestOtp.isPending ? "در حال ارسال..." : "ادامه"}
      </button>
    </form>
  );
}
