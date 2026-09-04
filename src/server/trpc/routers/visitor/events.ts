import { TRPCError } from "@trpc/server";

import { z } from "zod";

import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";

import { router, visitorProcedure } from "../../trpc";

const eventsListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),

  province: z.string().trim().optional(),

  city: z.string().trim().optional(),

  upcomingOnly: z.boolean().default(true),
});

export const visitorEventsRouter = router({
  list: visitorProcedure
    .input(eventsListSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const search = input.search?.trim() || undefined;

      const province = input.province?.trim() || undefined;

      const city = input.city?.trim() || undefined;

      const where = {
        ...(input.upcomingOnly
          ? {
              date: {
                gte: new Date(),
              },
            }
          : {}),

        ...(province || city
          ? {
              place: {
                ...(province
                  ? {
                      placeProvince: province,
                    }
                  : {}),

                ...(city
                  ? {
                      placeCity: city,
                    }
                  : {}),
              },
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  eventName: {
                    contains: search,

                    mode: "insensitive" as const,
                  },
                },

                {
                  description: {
                    contains: search,

                    mode: "insensitive" as const,
                  },
                },

                {
                  info: {
                    contains: search,

                    mode: "insensitive" as const,
                  },
                },

                {
                  suitable: {
                    contains: search,

                    mode: "insensitive" as const,
                  },
                },

                {
                  place: {
                    placeName: {
                      contains: search,

                      mode: "insensitive" as const,
                    },
                  },
                },

                {
                  place: {
                    placeCity: {
                      contains: search,

                      mode: "insensitive" as const,
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

      const [items, total] = await Promise.all([
        ctx.prisma.event.findMany({
          where,

          skip,

          take,

          orderBy: [
            {
              date: "asc",
            },

            {
              createdAt: "desc",
            },
          ],

          select: {
            id: true,

            eventName: true,

            date: true,

            hour: true,

            price: true,

            description: true,

            images: {
              orderBy: {
                sortOrder: "asc",
              },

              take: 1,

              select: {
                id: true,

                url: true,

                sortOrder: true,
              },
            },

            place: {
              select: {
                id: true,

                placeName: true,

                placeProvince: true,

                placeCity: true,
              },
            },

            savedBy: {
              where: {
                userId,
              },

              take: 1,

              select: {
                userId: true,
              },
            },

            _count: {
              select: {
                plans: true,

                comments: true,

                savedBy: true,
              },
            },
          },
        }),

        ctx.prisma.event.count({
          where,
        }),
      ]);

      return {
        items: items.map((event) => ({
          ...event,

          price: event.price?.toString() ?? null,

          isSaved: event.savedBy.length > 0,

          savedBy: undefined,
        })),

        pagination: {
          page: input.page,

          pageSize: input.pageSize,

          total,

          totalPages: getTotalPages(total, input.pageSize),
        },
      };
    }),

  getById: visitorProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: input.eventId,
        },

        select: {
          id: true,

          eventName: true,

          date: true,

          hour: true,

          price: true,

          description: true,

          suitable: true,

          rule: true,

          info: true,

          images: {
            orderBy: {
              sortOrder: "asc",
            },

            select: {
              id: true,

              url: true,

              sortOrder: true,
            },
          },

          plans: {
            orderBy: [
              {
                sortOrder: "asc",
              },

              {
                createdAt: "asc",
              },
            ],

            select: {
              id: true,

              hour: true,

              plan: true,

              sortOrder: true,
            },
          },

          place: {
            select: {
              id: true,

              placeName: true,

              placeProvince: true,

              placeCity: true,

              location: {
                select: {
                  id: true,

                  title: true,

                  address: true,

                  latitude: true,

                  longitude: true,
                },
              },

              host: {
                select: {
                  user: {
                    select: {
                      id: true,

                      fullName: true,

                      profileImage: true,
                    },
                  },
                },
              },
            },
          },

          savedBy: {
            where: {
              userId,
            },

            take: 1,

            select: {
              userId: true,
            },
          },

          _count: {
            select: {
              savedBy: true,

              comments: true,

              plans: true,
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "ایونت پیدا نشد.",
        });
      }

      const similarEvents = await ctx.prisma.event.findMany({
        where: {
          id: {
            not: event.id,
          },

          date: {
            gte: new Date(),
          },

          ...(event.place.placeCity
            ? {
                place: {
                  placeCity: event.place.placeCity,
                },
              }
            : {}),
        },

        orderBy: {
          date: "asc",
        },

        take: 4,

        select: {
          id: true,

          eventName: true,

          date: true,

          hour: true,

          price: true,

          description: true,

          images: {
            orderBy: {
              sortOrder: "asc",
            },

            take: 1,

            select: {
              id: true,

              url: true,

              sortOrder: true,
            },
          },

          place: {
            select: {
              id: true,

              placeName: true,

              placeProvince: true,

              placeCity: true,
            },
          },

          savedBy: {
            where: {
              userId,
            },

            take: 1,

            select: {
              userId: true,
            },
          },
        },
      });

      return {
        ...event,

        price: event.price?.toString() ?? null,

        isSaved: event.savedBy.length > 0,

        savedBy: undefined,

        similarEvents: similarEvents.map((item) => ({
          ...item,

          price: item.price?.toString() ?? null,

          isSaved: item.savedBy.length > 0,

          savedBy: undefined,
        })),
      };
    }),

  save: visitorProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const event = await ctx.prisma.event.findUnique({
        where: {
          id: input.eventId,
        },

        select: {
          id: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "ایونت پیدا نشد.",
        });
      }

      await ctx.prisma.savedEvent.upsert({
        where: {
          userId_eventId: {
            userId,

            eventId: event.id,
          },
        },

        create: {
          userId,

          eventId: event.id,
        },

        update: {},
      });

      return {
        success: true,

        isSaved: true,
      };
    }),

  unsave: visitorProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.prisma.savedEvent.deleteMany({
        where: {
          userId,

          eventId: input.eventId,
        },
      });

      return {
        success: true,

        isSaved: false,
      };
    }),
});
