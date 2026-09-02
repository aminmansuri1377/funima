import { prisma } from "@/server/db/prisma";

export async function createTRPCContext() {
  return {
    prisma,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
