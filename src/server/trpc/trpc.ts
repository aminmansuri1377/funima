import { initTRPC, TRPCError } from "@trpc/server";

import superjson from "superjson";

import { UserRole } from "@/generated/prisma/client";

import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;

export const publicProcedure = t.procedure;

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id || !ctx.session.user.activeRole) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return next({
    ctx: {
      ...ctx,

      session: {
        ...ctx.session,
        user: ctx.session.user,
      },
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

function roleMiddleware(requiredRole: UserRole) {
  return t.middleware(({ ctx, next }) => {
    const user = ctx.session?.user;

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
      });
    }

    if (user.activeRole !== requiredRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this resource",
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: {
          ...ctx.session,
          user,
        },
      },
    });
  });
}

export const visitorProcedure = protectedProcedure.use(
  roleMiddleware(UserRole.VISITOR),
);

export const hostProcedure = protectedProcedure.use(
  roleMiddleware(UserRole.HOST),
);

export const adminProcedure = protectedProcedure.use(
  roleMiddleware(UserRole.ADMIN),
);

export { TRPCError };
