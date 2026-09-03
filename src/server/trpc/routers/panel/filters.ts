import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../trpc";

export const panelFiltersRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.filter.findMany({
      include: {
        values: {
          orderBy: {
            createdAt: "asc",
          },

          include: {
            _count: {
              select: {
                places: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "نام فیلتر کوتاه است").max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();

      const existing = await ctx.prisma.filter.findUnique({
        where: {
          name,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "فیلتری با این نام قبلاً وجود دارد.",
        });
      }

      const filter = await ctx.prisma.filter.create({
        data: {
          name,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_FILTER",

            entity: "Filter",

            entityId: filter.id,

            metadata: {
              name: filter.name,
            },
          },
        });
      } catch (error) {
        console.error("[panel.filters.create] AuditLog:", error);
      }

      return {
        success: true,
        filter,
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        filterId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const filter = await ctx.prisma.filter.findUnique({
        where: {
          id: input.filterId,
        },

        include: {
          _count: {
            select: {
              values: true,
            },
          },
        },
      });

      if (!filter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "فیلتر پیدا نشد.",
        });
      }

      await ctx.prisma.filter.delete({
        where: {
          id: filter.id,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_FILTER",

            entity: "Filter",

            entityId: filter.id,

            metadata: {
              name: filter.name,

              valuesCount: filter._count.values,
            },
          },
        });
      } catch (error) {
        console.error("[panel.filters.delete] AuditLog:", error);
      }

      return {
        success: true,
      };
    }),

  createValue: adminProcedure
    .input(
      z.object({
        filterId: z.string().min(1),

        name: z.string().trim().min(1, "نام گزینه الزامی است").max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const filter = await ctx.prisma.filter.findUnique({
        where: {
          id: input.filterId,
        },
      });

      if (!filter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "فیلتر پیدا نشد.",
        });
      }

      const name = input.name.trim();

      const existing = await ctx.prisma.filterValue.findUnique({
        where: {
          filterId_name: {
            filterId: filter.id,

            name,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "این گزینه قبلاً در فیلتر وجود دارد.",
        });
      }

      const value = await ctx.prisma.filterValue.create({
        data: {
          filterId: filter.id,

          name,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_FILTER_VALUE",

            entity: "FilterValue",

            entityId: value.id,

            metadata: {
              filterId: filter.id,

              filterName: filter.name,

              valueName: value.name,
            },
          },
        });
      } catch (error) {
        console.error("[panel.filters.createValue] AuditLog:", error);
      }

      return {
        success: true,
        value,
      };
    }),

  deleteValue: adminProcedure
    .input(
      z.object({
        filterValueId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const value = await ctx.prisma.filterValue.findUnique({
        where: {
          id: input.filterValueId,
        },

        include: {
          filter: true,

          _count: {
            select: {
              places: true,
            },
          },
        },
      });

      if (!value) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "گزینه فیلتر پیدا نشد.",
        });
      }

      await ctx.prisma.filterValue.delete({
        where: {
          id: value.id,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_FILTER_VALUE",

            entity: "FilterValue",

            entityId: value.id,

            metadata: {
              filterId: value.filterId,

              filterName: value.filter.name,

              valueName: value.name,

              placesCount: value._count.places,
            },
          },
        });
      } catch (error) {
        console.error("[panel.filters.deleteValue] AuditLog:", error);
      }

      return {
        success: true,
      };
    }),

  placeOptions: adminProcedure
    .input(
      z.object({
        placeId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const place = await ctx.prisma.place.findUnique({
        where: {
          id: input.placeId,
        },

        select: {
          id: true,

          filterValues: {
            select: {
              filterValueId: true,
            },
          },
        },
      });

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "مکان پیدا نشد.",
        });
      }

      const filters = await ctx.prisma.filter.findMany({
        include: {
          values: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

      return {
        filters,

        selectedIds: place.filterValues.map((item) => item.filterValueId),
      };
    }),

  setPlaceValues: adminProcedure
    .input(
      z.object({
        placeId: z.string().min(1),

        filterValueIds: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const place = await ctx.prisma.place.findUnique({
        where: {
          id: input.placeId,
        },

        select: {
          id: true,
          placeName: true,
        },
      });

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "مکان پیدا نشد.",
        });
      }

      const uniqueIds = Array.from(new Set(input.filterValueIds));

      if (uniqueIds.length > 0) {
        const validCount = await ctx.prisma.filterValue.count({
          where: {
            id: {
              in: uniqueIds,
            },
          },
        });

        if (validCount !== uniqueIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "یک یا چند گزینه فیلتر معتبر نیست.",
          });
        }
      }

      /*
       * به دلیل مشکلی که قبلاً با
       * interactive transaction +
       * Supabase Pooler دیدیم،
       * فعلاً transaction callback
       * استفاده نمی‌کنیم.
       */
      await ctx.prisma.placeFilterValue.deleteMany({
        where: {
          placeId: place.id,
        },
      });

      if (uniqueIds.length > 0) {
        await ctx.prisma.placeFilterValue.createMany({
          data: uniqueIds.map((filterValueId) => ({
            placeId: place.id,

            filterValueId,
          })),

          skipDuplicates: true,
        });
      }

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "UPDATE_PLACE_FILTERS",

            entity: "Place",

            entityId: place.id,

            metadata: {
              placeName: place.placeName,

              filterValueIds: uniqueIds,
            },
          },
        });
      } catch (error) {
        console.error("[panel.filters.setPlaceValues] AuditLog:", error);
      }

      return {
        success: true,
      };
    }),
});
