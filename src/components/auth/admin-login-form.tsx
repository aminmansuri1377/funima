"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { saveAuthFlow } from "@/lib/auth/flow-storage";
import { z } from "zod";

import { phoneNumberSchema } from "@/lib/auth/schemas";

import { trpc } from "@/trpc/client";

const formSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

type FormInput = z.infer<typeof formSchema>;

export function AdminLoginForm() {
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
            `لطفاً ${result.retryAfterSeconds} ثانیه دیگر تلاش کنید.`,
          );

          return;
        }

        setServerError("امکان ارسال کد وجود ندارد.");

        return;
      }

      saveAuthFlow({
        phoneNumber: values.phoneNumber.trim(),

        fullName: "",

        role: "ADMIN",
      });

      router.push("/auth/otp");
    } catch {
      setServerError("خطایی رخ داد.");
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

      {serverError && <p>{serverError}</p>}

      <button type="submit" disabled={isSubmitting || requestOtp.isPending}>
        دریافت کد
      </button>
    </form>
  );
}
