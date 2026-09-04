import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";

import { router, visitorProcedure } from "../../trpc";

export const visitorSavedRouter = router({
  places: visitorProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const { skip, take } = getPagination({
        page: input.page,

        pageSize: input.pageSize,
      });

      const where = {
        userId,
      };

      const [items, total] = await Promise.all([
        ctx.prisma.savedPlace.findMany({
          where,

          skip,

          take,

          orderBy: {
            createdAt: "desc",
          },

          select: {
            createdAt: true,

            place: {
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

                _count: {
                  select: {
                    comments: true,

                    savedBy: true,

                    events: true,
                  },
                },
              },
            },
          },
        }),

        ctx.prisma.savedPlace.count({
          where,
        }),
      ]);

      return {
        items: items.map((item) => ({
          ...item.place,

          isSaved: true,

          savedAt: item.createdAt,
        })),

        pagination: {
          page: input.page,

          pageSize: input.pageSize,

          total,

          totalPages: getTotalPages(total, input.pageSize),
        },
      };
    }),

  events: visitorProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const { skip, take } = getPagination({
        page: input.page,

        pageSize: input.pageSize,
      });

      const where = {
        userId,
      };

      const [items, total] = await Promise.all([
        ctx.prisma.savedEvent.findMany({
          where,

          skip,

          take,

          orderBy: {
            createdAt: "desc",
          },

          select: {
            createdAt: true,

            event: {
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

                _count: {
                  select: {
                    comments: true,

                    savedBy: true,

                    plans: true,
                  },
                },
              },
            },
          },
        }),

        ctx.prisma.savedEvent.count({
          where,
        }),
      ]);

      return {
        items: items.map((item) => ({
          ...item.event,

          price: item.event.price?.toString() ?? null,

          isSaved: true,

          savedAt: item.createdAt,
        })),

        pagination: {
          page: input.page,

          pageSize: input.pageSize,

          total,

          totalPages: getTotalPages(total, input.pageSize),
        },
      };
    }),
});
