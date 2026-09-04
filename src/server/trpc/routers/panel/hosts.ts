import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";

import { UserRole } from "@/generated/prisma/client";

import { adminProcedure, router } from "../../trpc";

const hostsListInputSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
});

export const panelHostsRouter = router({
  list: adminProcedure
    .input(hostsListInputSchema)
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
        ctx.prisma.host.findMany({
          where,

          skip,
          take,

          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                roles: true,
                createdAt: true,
              },
            },

            place: {
              select: {
                id: true,
                placeName: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        }),

        ctx.prisma.host.count({
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

  create: adminProcedure
    .input(
      z.object({
        phoneNumber: z.string().trim().min(10),

        fullName: z.string().trim().min(2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.prisma.user.findUnique({
        where: {
          phoneNumber: input.phoneNumber.trim(),
        },
      });

      if (existingUser?.roles.includes(UserRole.HOST)) {
        throw new TRPCError({
          code: "CONFLICT",

          message: "این کاربر قبلاً میزبان است.",
        });
      }

      if (existingUser) {
        const updated = await ctx.prisma.user.update({
          where: {
            id: existingUser.id,
          },

          data: {
            fullName: input.fullName.trim(),

            roles: Array.from(new Set([...existingUser.roles, UserRole.HOST])),

            host: {
              create: {},
            },
          },
        });

        return {
          success: true,
          userId: updated.id,
        };
      }

      const created = await ctx.prisma.user.create({
        data: {
          phoneNumber: input.phoneNumber.trim(),

          fullName: input.fullName.trim(),

          roles: [UserRole.HOST],

          host: {
            create: {},
          },
        },
      });

      return {
        success: true,
        userId: created.id,
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        hostId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const host = await ctx.prisma.host.findUnique({
        where: {
          id: input.hostId,
        },

        include: {
          user: true,
          place: true,
        },
      });

      if (!host) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "میزبان پیدا نشد.",
        });
      }

      if (host.place) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",

          message: "این میزبان دارای مکان است. ابتدا مکان را حذف کنید.",
        });
      }

      const remainingRoles = host.user.roles.filter(
        (role) => role !== UserRole.HOST,
      );

      await ctx.prisma.host.delete({
        where: {
          id: host.id,
        },
      });

      if (remainingRoles.length === 0) {
        await ctx.prisma.user.delete({
          where: {
            id: host.userId,
          },
        });
      } else {
        await ctx.prisma.user.update({
          where: {
            id: host.userId,
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
