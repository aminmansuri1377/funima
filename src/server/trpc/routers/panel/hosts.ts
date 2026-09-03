import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { UserRole } from "@/generated/prisma/client";

import { adminProcedure, router } from "../../trpc";

const createHostSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(10, "شماره موبایل معتبر نیست")
    .max(15, "شماره موبایل معتبر نیست"),

  fullName: z
    .string()
    .trim()
    .min(2, "نام و نام خانوادگی کوتاه است")
    .max(100, "نام و نام خانوادگی طولانی است"),
});

export const panelHostsRouter = router({
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

      return ctx.prisma.host.findMany({
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

        take: 100,
      });
    }),

  create: adminProcedure
    .input(createHostSchema)
    .mutation(async ({ ctx, input }) => {
      const phoneNumber = input.phoneNumber.trim();

      const fullName = input.fullName.trim();

      const result = await ctx.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: {
            phoneNumber,
          },

          include: {
            host: true,
          },
        });

        if (existingUser?.host || existingUser?.roles.includes(UserRole.HOST)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "این شماره قبلاً به عنوان میزبان ثبت شده است.",
          });
        }

        if (existingUser) {
          const roles = Array.from(
            new Set([...existingUser.roles, UserRole.HOST]),
          );

          const updatedUser = await tx.user.update({
            where: {
              id: existingUser.id,
            },

            data: {
              fullName,
              roles,

              host: {
                create: {},
              },
            },

            include: {
              host: true,
            },
          });

          await tx.auditLog.create({
            data: {
              adminId: ctx.session.user.id,

              action: "CREATE_HOST",

              entity: "Host",

              entityId: updatedUser.host?.id,

              metadata: {
                userId: updatedUser.id,
                phoneNumber,
                existingUser: true,
              },
            },
          });

          return updatedUser;
        }

        const newUser = await tx.user.create({
          data: {
            phoneNumber,
            fullName,

            roles: [UserRole.HOST],

            host: {
              create: {},
            },
          },

          include: {
            host: true,
          },
        });

        await tx.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_HOST",

            entity: "Host",

            entityId: newUser.host?.id,

            metadata: {
              userId: newUser.id,
              phoneNumber,
              existingUser: false,
            },
          },
        });

        return newUser;
      });

      return {
        success: true,
        userId: result.id,
        hostId: result.host?.id,
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        hostId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const host = await tx.host.findUnique({
          where: {
            id: input.hostId,
          },

          include: {
            place: {
              select: {
                id: true,
                placeName: true,
              },
            },

            user: true,
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
            message:
              "این میزبان دارای مکان است. ابتدا مکان او را حذف یا منتقل کنید.",
          });
        }

        const remainingRoles = host.user.roles.filter(
          (role) => role !== UserRole.HOST,
        );

        await tx.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_HOST",

            entity: "Host",

            entityId: host.id,

            metadata: {
              userId: host.user.id,
              phoneNumber: host.user.phoneNumber,
            },
          },
        });

        if (remainingRoles.length === 0) {
          await tx.user.delete({
            where: {
              id: host.user.id,
            },
          });

          return;
        }

        await tx.host.delete({
          where: {
            id: host.id,
          },
        });

        await tx.user.update({
          where: {
            id: host.user.id,
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
