import { z } from "zod";

import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";

import { adminProcedure, router } from "../../trpc";

const listInputSchema = paginationSchema.extend({
  search: z.string().trim().optional(),

  action: z.string().trim().optional(),

  entity: z.string().trim().optional(),
});

export const panelAuditLogsRouter = router({
  list: adminProcedure.input(listInputSchema).query(async ({ ctx, input }) => {
    const search = input.search?.trim() || undefined;

    const action = input.action?.trim() || undefined;

    const entity = input.entity?.trim() || undefined;

    const where = {
      ...(action
        ? {
            action,
          }
        : {}),

      ...(entity
        ? {
            entity,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                action: {
                  contains: search,

                  mode: "insensitive" as const,
                },
              },

              {
                entity: {
                  contains: search,

                  mode: "insensitive" as const,
                },
              },

              {
                entityId: {
                  contains: search,
                },
              },

              {
                admin: {
                  fullName: {
                    contains: search,

                    mode: "insensitive" as const,
                  },
                },
              },

              {
                admin: {
                  phoneNumber: {
                    contains: search,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const { skip, take } = getPagination({
      page: input.page,

      pageSize: input.pageSize,
    });

    /*
     * این Promise.all
     * interactive transaction نیست.
     * پس مشکل قبلی Supabase Pooler
     * را ایجاد نمی‌کند.
     */
    const [items, total] = await Promise.all([
      ctx.prisma.auditLog.findMany({
        where,

        skip,
        take,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          admin: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
        },
      }),

      ctx.prisma.auditLog.count({
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

  filters: adminProcedure.query(async ({ ctx }) => {
    const [actions, entities] = await Promise.all([
      ctx.prisma.auditLog.findMany({
        distinct: ["action"],

        select: {
          action: true,
        },

        orderBy: {
          action: "asc",
        },
      }),

      ctx.prisma.auditLog.findMany({
        distinct: ["entity"],

        select: {
          entity: true,
        },

        orderBy: {
          entity: "asc",
        },
      }),
    ]);

    return {
      actions: actions.map((item) => item.action),

      entities: entities.map((item) => item.entity),
    };
  }),
});
