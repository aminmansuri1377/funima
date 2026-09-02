import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ next }) => {
  // TODO:
  // بعد از پیاده‌سازی NextAuth،
  // session اینجا بررسی می‌شود.

  return next();
});

export const adminProcedure = t.procedure.use(async ({ next }) => {
  // TODO:
  // بعد از پیاده‌سازی NextAuth،
  // وجود role = ADMIN اینجا بررسی می‌شود.

  return next();
});

export { TRPCError };
