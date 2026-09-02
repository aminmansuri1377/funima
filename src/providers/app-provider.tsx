"use client";

import { TRPCProvider } from "@/trpc/provider";

type AppProviderProps = {
  children: React.ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
