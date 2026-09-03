import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { UserRole } from "@/generated/prisma/client";

import { adminProcedure, router } from "../../trpc";

export const panelVisitorsRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          search: z.string().trim().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const search = input?.search?.trim() || undefined;

      return ctx.prisma.visitor.findMany({
        where: search
          ? {
              user: {
                OR: [
                  {
                    fullName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    phoneNumber: {
                      contains: search,
                    },
                  },
                ],
              },
            }
          : undefined,

        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              profileImage: true,
              roles: true,
              createdAt: true,

              _count: {
                select: {
                  comments: true,
                  savedPlaces: true,
                  savedEvents: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 100,
      });
    }),

  delete: adminProcedure
    .input(
      z.object({
        visitorId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const visitor = await tx.visitor.findUnique({
          where: {
            id: input.visitorId,
          },

          include: {
            user: true,
          },
        });

        if (!visitor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "بازدیدکننده پیدا نشد.",
          });
        }

        const remainingRoles = visitor.user.roles.filter(
          (role) => role !== UserRole.VISITOR,
        );

        /*
         * Audit را قبل از حذف می‌سازیم
         * چون ممکن است خود User هم حذف شود.
         */
        await tx.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_VISITOR",

            entity: "Visitor",

            entityId: visitor.id,

            metadata: {
              userId: visitor.user.id,

              phoneNumber: visitor.user.phoneNumber,

              remainingRoles: remainingRoles,
            },
          },
        });

        /*
         * اگر VISITOR تنها role کاربر باشد،
         * User هم حذف می‌شود.
         *
         * به دلیل Cascade:
         * Visitor
         * Comments
         * SavedPlaces
         * SavedEvents
         * هم حذف می‌شوند.
         */
        if (remainingRoles.length === 0) {
          await tx.user.delete({
            where: {
              id: visitor.user.id,
            },
          });

          return;
        }

        /*
         * اگر مثلاً کاربر HOST یا ADMIN هم باشد،
         * فقط Visitor profile و role VISITOR
         * را حذف می‌کنیم.
         */
        await tx.visitor.delete({
          where: {
            id: visitor.id,
          },
        });

        await tx.user.update({
          where: {
            id: visitor.user.id,
          },

          data: {
            roles: remainingRoles,
          },
        });
      });

      return {
        success: true,
      };
    }),
});
