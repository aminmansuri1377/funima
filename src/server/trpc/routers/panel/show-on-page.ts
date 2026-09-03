import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../trpc";

export const panelShowOnPageRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.showOnPage.findMany({
      include: {
        places: {
          orderBy: {
            sortOrder: "asc",
          },

          include: {
            place: {
              select: {
                id: true,
                placeName: true,
                placeCity: true,
                placeType: true,

                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },

                  take: 1,

                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        sortOrder: "asc",
      },
    });
  }),

  availablePlaces: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.place.findMany({
      select: {
        id: true,
        placeName: true,
        placeCity: true,

        host: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },

      orderBy: {
        placeName: "asc",
      },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().trim().min(2, "عنوان کوتاه است").max(150),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const last = await ctx.prisma.showOnPage.findFirst({
        orderBy: {
          sortOrder: "desc",
        },

        select: {
          sortOrder: true,
        },
      });

      const section = await ctx.prisma.showOnPage.create({
        data: {
          title: input.title.trim(),

          sortOrder: (last?.sortOrder ?? -1) + 1,

          isActive: true,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_SHOW_ON_PAGE",

            entity: "ShowOnPage",

            entityId: section.id,

            metadata: {
              title: section.title,
            },
          },
        });
      } catch (error) {
        console.error("[showOnPage.create] AuditLog:", error);
      }

      return {
        success: true,
        section,
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),

        title: z.string().trim().min(2).max(150),

        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const section = await ctx.prisma.showOnPage.update({
        where: {
          id: input.id,
        },

        data: {
          title: input.title.trim(),

          isActive: input.isActive,
        },
      });

      return {
        success: true,
        section,
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const section = await ctx.prisma.showOnPage.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!section) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "سکشن پیدا نشد.",
        });
      }

      await ctx.prisma.showOnPage.delete({
        where: {
          id: section.id,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_SHOW_ON_PAGE",

            entity: "ShowOnPage",

            entityId: section.id,

            metadata: {
              title: section.title,
            },
          },
        });
      } catch (error) {
        console.error("[showOnPage.delete] AuditLog:", error);
      }

      return {
        success: true,
      };
    }),

  addPlace: adminProcedure
    .input(
      z.object({
        showOnPageId: z.string().min(1),

        placeId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.showOnPagePlace.findUnique({
        where: {
          showOnPageId_placeId: {
            showOnPageId: input.showOnPageId,

            placeId: input.placeId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "این مکان قبلاً در این سکشن وجود دارد.",
        });
      }

      const last = await ctx.prisma.showOnPagePlace.findFirst({
        where: {
          showOnPageId: input.showOnPageId,
        },

        orderBy: {
          sortOrder: "desc",
        },

        select: {
          sortOrder: true,
        },
      });

      await ctx.prisma.showOnPagePlace.create({
        data: {
          showOnPageId: input.showOnPageId,

          placeId: input.placeId,

          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
      });

      return {
        success: true,
      };
    }),

  removePlace: adminProcedure
    .input(
      z.object({
        showOnPageId: z.string().min(1),

        placeId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.showOnPagePlace.delete({
        where: {
          showOnPageId_placeId: {
            showOnPageId: input.showOnPageId,

            placeId: input.placeId,
          },
        },
      });

      return {
        success: true,
      };
    }),

  reorderSections: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      /*
       * عمداً interactive transaction
       * استفاده نمی‌کنیم چون قبلاً
       * Supabase pooler با آن مشکل داشت.
       */
      for (let index = 0; index < input.ids.length; index++) {
        await ctx.prisma.showOnPage.update({
          where: {
            id: input.ids[index],
          },

          data: {
            sortOrder: index,
          },
        });
      }

      return {
        success: true,
      };
    }),

  reorderPlaces: adminProcedure
    .input(
      z.object({
        showOnPageId: z.string().min(1),

        placeIds: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      for (let index = 0; index < input.placeIds.length; index++) {
        await ctx.prisma.showOnPagePlace.update({
          where: {
            showOnPageId_placeId: {
              showOnPageId: input.showOnPageId,

              placeId: input.placeIds[index],
            },
          },

          data: {
            sortOrder: index,
          },
        });
      }

      return {
        success: true,
      };
    }),
});
