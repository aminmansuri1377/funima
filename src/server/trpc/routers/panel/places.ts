import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../trpc";
import { PlaceType } from "@/generated/prisma/client";
const createPlaceSchema = z.object({
  hostId: z.string().min(1),

  placeName: z.string().trim().min(2, "نام مکان کوتاه است").max(150),

  placePhone: z.string().trim().optional(),

  placeType: z.enum(PlaceType),

  placeCity: z.string().trim().min(2, "شهر الزامی است").max(100),

  instagramId: z.string().trim().optional(),

  description: z.string().trim().optional(),
});

export const panelPlacesRouter = router({
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

      return ctx.prisma.place.findMany({
        where: search
          ? {
              OR: [
                {
                  placeName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  placeCity: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  host: {
                    user: {
                      fullName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : undefined,

        include: {
          host: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                },
              },
            },
          },

          images: {
            orderBy: {
              sortOrder: "asc",
            },
            take: 1,
          },

          _count: {
            select: {
              events: true,
              comments: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 100,
      });
    }),

  availableHosts: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.host.findMany({
      where: {
        place: null,
      },

      select: {
        id: true,

        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
      },

      orderBy: {
        user: {
          fullName: "asc",
        },
      },
    });
  }),

  create: adminProcedure
    .input(createPlaceSchema)
    .mutation(async ({ ctx, input }) => {
      const host = await ctx.prisma.host.findUnique({
        where: {
          id: input.hostId,
        },

        include: {
          place: true,

          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
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
          code: "CONFLICT",
          message: "این میزبان قبلاً دارای مکان است.",
        });
      }

      const place = await ctx.prisma.place.create({
        data: {
          hostId: host.id,

          placeName: input.placeName.trim(),

          placePhone: input.placePhone?.trim() || null,

          /*
           * Prisma enum
           */
          placeType: input.placeType,

          placeCity: input.placeCity.trim(),

          instagramId: input.instagramId?.trim() || null,

          description: input.description?.trim() || null,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_PLACE",

            entity: "Place",

            entityId: place.id,

            metadata: {
              placeName: place.placeName,

              placeType: place.placeType,

              hostId: host.id,

              hostUserId: host.user.id,

              hostPhoneNumber: host.user.phoneNumber,
            },
          },
        });
      } catch (error) {
        /*
         * Audit failure should not make
         * the user think Place creation
         * itself failed.
         *
         * We log it server-side.
         */
        console.error("[panel.places.create] AuditLog failed:", error);
      }

      return {
        success: true,
        placeId: place.id,
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        placeId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const place = await tx.place.findUnique({
          where: {
            id: input.placeId,
          },

          include: {
            host: {
              include: {
                user: true,
              },
            },

            _count: {
              select: {
                events: true,
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

        if (place._count.events > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "این مکان دارای رویداد است. ابتدا رویدادهای آن را حذف کنید.",
          });
        }

        await tx.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_PLACE",

            entity: "Place",

            entityId: place.id,

            metadata: {
              placeName: place.placeName,

              hostId: place.hostId,

              hostPhoneNumber: place.host.user.phoneNumber,
            },
          },
        });

        await tx.place.delete({
          where: {
            id: place.id,
          },
        });
      });

      return {
        success: true,
      };
    }),
});
