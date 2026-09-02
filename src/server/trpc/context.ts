import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";

export async function createTRPCContext() {
  const session = await auth();

  return {
    prisma,
    session,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
