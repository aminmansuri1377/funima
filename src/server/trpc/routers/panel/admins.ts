import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { UserRole } from "@/generated/prisma/client";

import { adminProcedure, router } from "../../trpc";

const createAdminSchema = z.object({
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

export const panelAdminsRouter = router({
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

      return ctx.prisma.user.findMany({
        where: {
          roles: {
            has: UserRole.ADMIN,
          },

          ...(search
            ? {
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
              }
            : {}),
        },

        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          profileImage: true,
          roles: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  create: adminProcedure
    .input(createAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const phoneNumber = input.phoneNumber.trim();

      const fullName = input.fullName.trim();

      return ctx.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: {
            phoneNumber,
          },
        });

        if (existingUser?.roles.includes(UserRole.ADMIN)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "این کاربر قبلاً مدیر است.",
          });
        }

        let userId: string;

        if (existingUser) {
          const updated = await tx.user.update({
            where: {
              id: existingUser.id,
            },

            data: {
              fullName,

              roles: Array.from(
                new Set([...existingUser.roles, UserRole.ADMIN]),
              ),
            },
          });

          userId = updated.id;
        } else {
          const created = await tx.user.create({
            data: {
              phoneNumber,
              fullName,

              roles: [UserRole.ADMIN],
            },
          });

          userId = created.id;
        }

        await tx.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_ADMIN",

            entity: "User",

            entityId: userId,

            metadata: {
              phoneNumber,
            },
          },
        });

        return {
          success: true,
          userId,
        };
      });
    }),

  removeRole: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "نمی‌توانید دسترسی مدیریت خودتان را حذف کنید.",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: {
            id: input.userId,
          },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "کاربر پیدا نشد.",
          });
        }

        if (!user.roles.includes(UserRole.ADMIN)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "این کاربر مدیر نیست.",
          });
        }

        const adminCount = await tx.user.count({
          where: {
            roles: {
              has: UserRole.ADMIN,
            },
          },
        });

        if (adminCount <= 1) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "آخرین مدیر سیستم قابل حذف نیست.",
          });
        }

        const remainingRoles = user.roles.filter(
          (role) => role !== UserRole.ADMIN,
        );

        await tx.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "REMOVE_ADMIN_ROLE",

            entity: "User",

            entityId: user.id,

            metadata: {
              phoneNumber: user.phoneNumber,

              remainingRoles,
            },
          },
        });

        if (remainingRoles.length === 0) {
          await tx.user.delete({
            where: {
              id: user.id,
            },
          });

          return;
        }

        await tx.user.update({
          where: {
            id: user.id,
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
