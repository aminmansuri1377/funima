"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { otpCodeSchema } from "@/lib/auth/schemas";

import { loginWithOtp, signupWithOtp } from "@/lib/auth/client";

import { getRoleHome } from "@/lib/auth/routes";

import {
  clearAuthFlow,
  emptyAuthFlow,
  getAuthFlow,
  type AuthFlowState,
} from "@/lib/auth/flow-storage";

const formSchema = z.object({
  code: otpCodeSchema,
});

type FormInput = z.infer<typeof formSchema>;

export default function OtpPage() {
  const router = useRouter();

  const [authFlow, setAuthFlow] = useState<AuthFlowState>(emptyAuthFlow);

  const [isReady, setIsReady] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
  });

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

  return (
    <main>
      <h1>کد تایید</h1>

      <p>کد ارسال شده به {authFlow.phoneNumber} را وارد کنید.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          autoComplete="one-time-code"
          {...register("code")}
        />

        {errors.code && <p>{errors.code.message}</p>}

        {serverError && <p>{serverError}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "در حال بررسی..." : "تایید"}
        </button>
      </form>
    </main>
  );
}
