"use client";

import { signIn, signOut } from "next-auth/react";

import type { LoginCredentialsInput, SignupCredentialsInput } from "./schemas";

type AuthSuccess = {
  success: true;
};

type AuthFailure = {
  success: false;
  error: string;
};

export async function loginWithOtp(
  input: LoginCredentialsInput,
): Promise<AuthSuccess | AuthFailure> {
  const result = await signIn("credentials", {
    phoneNumber: input.phoneNumber,

    code: input.code,

    role: input.role,

    redirect: false,
  });

  if (result?.error) {
    return {
      success: false,
      error: "AUTHENTICATION_FAILED",
    };
  }

  return {
    success: true,
  };
}

export async function signupWithOtp(
  input: SignupCredentialsInput,
): Promise<AuthSuccess | AuthFailure> {
  const result = await signIn("credentials", {
    phoneNumber: input.phoneNumber,

    fullName: input.fullName,

    code: input.code,

    role: input.role,

    redirect: false,
  });

  if (result?.error) {
    return {
      success: false,
      error: "AUTHENTICATION_FAILED",
    };
  }

  return {
    success: true,
  };
}

export async function logout() {
  await signOut({
    redirect: false,
  });
}
