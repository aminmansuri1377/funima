import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";

import { UserRole } from "@/generated/prisma/client";

import { adminProcedure, router } from "../../trpc";

const visitorsListInputSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
});

export const panelVisitorsRouter = router({
  list: adminProcedure
    .input(visitorsListInputSchema)
    .query(async ({ ctx, input }) => {
      const search = input.search?.trim() || undefined;

      const where = {
        ...(search
          ? {
              user: {
                OR: [
                  {
                    fullName: {
                      contains: search,

                      mode: "insensitive" as const,
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
          : {}),
      };

      const { skip, take } = getPagination({
        page: input.page,

        pageSize: input.pageSize,
      });

      const [items, total] = await Promise.all([
        ctx.prisma.visitor.findMany({
          where,

          skip,
          take,

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
        }),

        ctx.prisma.visitor.count({
          where,
        }),
      ]);

      return {
        items,

        pagination: {
          page: input.page,

          pageSize: input.pageSize,

          total,

          totalPages: getTotalPages(total, input.pageSize),
        },
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        visitorId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const visitor = await ctx.prisma.visitor.findUnique({
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

      await ctx.prisma.visitor.delete({
        where: {
          id: visitor.id,
        },
      });

      if (remainingRoles.length === 0) {
        await ctx.prisma.user.delete({
          where: {
            id: visitor.userId,
          },
        });
      } else {
        await ctx.prisma.user.update({
          where: {
            id: visitor.userId,
          },

          data: {
            roles: remainingRoles,
          },
        });
      }

      return {
        success: true,
      };
    }),
});
