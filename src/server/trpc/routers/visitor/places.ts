import { TRPCError } from "@trpc/server";

import { z } from "zod";

import { PlaceType, UserRole } from "@/generated/prisma/client";

import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";

import { publicProcedure, router, visitorProcedure } from "../../trpc";

const GUEST_USER_ID = "__guest__";

const placesListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),

  province: z.string().trim().optional(),

  city: z.string().trim().optional(),

  placeType: z.enum(PlaceType).optional(),

  filterValueIds: z.array(z.string().min(1)).optional(),
});

export const visitorPlacesRouter = router({
  list: publicProcedure
    .input(placesListSchema)
    .query(async ({ ctx, input }) => {
      const userId =
        ctx.session?.user?.activeRole === UserRole.VISITOR
          ? ctx.session.user.id
          : null;

      const savedUserId = userId ?? GUEST_USER_ID;

      const search = input.search?.trim() || undefined;

      const province = input.province?.trim() || undefined;

      const city = input.city?.trim() || undefined;

      const filterValueIds = Array.from(new Set(input.filterValueIds ?? []));

      const where = {
        ...(search
          ? {
              OR: [
                {
                  placeName: {
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
                  placeCity: {
                    contains: search,

                    mode: "insensitive" as const,
                  },
                },

                {
                  placeProvince: {
                    contains: search,

                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),

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

        ...(input.placeType
          ? {
              placeType: input.placeType,
            }
          : {}),

        ...(filterValueIds.length > 0
          ? {
              filterValues: {
                some: {
                  filterValueId: {
                    in: filterValueIds,
                  },
                },
              },
            }
          : {}),
      };

      const { skip, take } = getPagination({
        page: input.page,

        pageSize: input.pageSize,
      });

      const [items, total] = await Promise.all([
        ctx.prisma.place.findMany({
          where,

          skip,

          take,

          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,

            placeName: true,

            placeType: true,

            placeProvince: true,

            placeCity: true,

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

            savedBy: {
              where: {
                userId: savedUserId,
              },

              take: 1,

              select: {
                userId: true,
              },
            },

            filterValues: {
              select: {
                filterValue: {
                  select: {
                    id: true,
                    name: true,

                    filter: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },

            _count: {
              select: {
                comments: true,

                savedBy: true,

                events: true,
              },
            },
          },
        }),

        ctx.prisma.place.count({
          where,
        }),
      ]);

      return {
        items: items.map((place) => ({
          ...place,

          isSaved: userId ? place.savedBy.length > 0 : false,

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

  getById: publicProcedure
    .input(
      z.object({
        placeId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId =
        ctx.session?.user?.activeRole === UserRole.VISITOR
          ? ctx.session.user.id
          : null;

      const savedUserId = userId ?? GUEST_USER_ID;

      const place = await ctx.prisma.place.findUnique({
        where: {
          id: input.placeId,
        },

        select: {
          id: true,

          placeName: true,

          placePhone: true,

          placeType: true,

          placeProvince: true,

          placeCity: true,

          instagramId: true,

          description: true,

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
              id: true,

              user: {
                select: {
                  id: true,

                  fullName: true,

                  profileImage: true,
                },
              },
            },
          },

          filterValues: {
            select: {
              filterValue: {
                select: {
                  id: true,

                  name: true,

                  filter: {
                    select: {
                      id: true,

                      name: true,
                    },
                  },
                },
              },
            },
          },

          savedBy: {
            where: {
              userId: savedUserId,
            },

            take: 1,

            select: {
              userId: true,
            },
          },

          comments: {
            orderBy: {
              createdAt: "desc",
            },

            take: 10,

            select: {
              id: true,

              content: true,

              createdAt: true,

              updatedAt: true,

              user: {
                select: {
                  id: true,

                  fullName: true,

                  profileImage: true,
                },
              },
            },
          },

          events: {
            where: {
              date: {
                gte: new Date(),
              },
            },

            orderBy: {
              date: "asc",
            },

            take: 6,

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

              savedBy: {
                where: {
                  userId: savedUserId,
                },

                take: 1,

                select: {
                  userId: true,
                },
              },
            },
          },

          _count: {
            select: {
              comments: true,

              savedBy: true,

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

      return {
        ...place,

        isSaved: userId ? place.savedBy.length > 0 : false,

        savedBy: undefined,

        events: place.events.map((event) => ({
          ...event,

          price: event.price?.toString() ?? null,

          isSaved: userId ? event.savedBy.length > 0 : false,

          savedBy: undefined,
        })),
      };
    }),

  save: visitorProcedure
    .input(
      z.object({
        placeId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const place = await ctx.prisma.place.findUnique({
        where: {
          id: input.placeId,
        },

        select: {
          id: true,
        },
      });

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "مکان پیدا نشد.",
        });
      }

      await ctx.prisma.savedPlace.upsert({
        where: {
          userId_placeId: {
            userId,

            placeId: place.id,
          },
        },

        create: {
          userId,

          placeId: place.id,
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
        placeId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.prisma.savedPlace.deleteMany({
        where: {
          userId,

          placeId: input.placeId,
        },
      });

      return {
        success: true,

        isSaved: false,
      };
    }),
});
