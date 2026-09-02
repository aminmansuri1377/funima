"use client";

import type { AuthRole } from "@/lib/auth/roles";

export type AuthFlowState = {
  phoneNumber: string;
  fullName: string;
  role: AuthRole | null;
};

const STORAGE_KEY = "funima-auth-flow";

export const emptyAuthFlow: AuthFlowState = {
  phoneNumber: "",
  fullName: "",
  role: null,
};

export function saveAuthFlow(value: AuthFlowState) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getAuthFlow(): AuthFlowState {
  if (typeof window === "undefined") {
    return emptyAuthFlow;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return emptyAuthFlow;
  }

  try {
    return JSON.parse(raw) as AuthFlowState;
  } catch {
    clearAuthFlow();
    return emptyAuthFlow;
  }
}

export function clearAuthFlow() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}
