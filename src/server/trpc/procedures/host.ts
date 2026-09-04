import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "../trpc";

export const hostProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const session = ctx.session;

  if (!session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "برای ادامه باید وارد حساب کاربری شوید.",
    });
  }

  const roles = session.user.roles ?? [];

  if (!roles.includes("HOST")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "این بخش فقط برای میزبان‌ها قابل دسترسی است.",
    });
  }

  if (session.user.activeRole !== "HOST") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "نقش فعال حساب کاربری باید میزبان باشد.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session,
    },
  });
});
