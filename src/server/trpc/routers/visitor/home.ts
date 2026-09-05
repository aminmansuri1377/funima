import { UserRole } from "@/generated/prisma/client";

import { publicProcedure, router } from "../../trpc";

const GUEST_USER_ID = "__guest__";

export const visitorHomeRouter = router({
  getSections: publicProcedure.query(async ({ ctx }) => {
    const userId =
      ctx.session?.user?.activeRole === UserRole.VISITOR
        ? ctx.session.user.id
        : null;

    const savedUserId = userId ?? GUEST_USER_ID;

    const sections = await ctx.prisma.showOnPage.findMany({
      where: {
        isActive: true,
      },

      orderBy: {
        sortOrder: "asc",
      },

      select: {
        id: true,
        title: true,
        sortOrder: true,

        places: {
          orderBy: {
            sortOrder: "asc",
          },

          select: {
            sortOrder: true,

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

                savedBy: {
                  where: {
                    userId: savedUserId,
                  },

                  select: {
                    userId: true,
                  },

                  take: 1,
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
                    savedBy: true,
                    comments: true,
                    events: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return sections.map((section) => ({
      id: section.id,

      title: section.title,

      sortOrder: section.sortOrder,

      places: section.places.map((item) => ({
        ...item.place,

        isSaved: userId ? item.place.savedBy.length > 0 : false,

        savedBy: undefined,

        sectionSortOrder: item.sortOrder,
      })),
    }));
  }),

  getFilters: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.filter.findMany({
      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,
        name: true,

        values: {
          orderBy: {
            name: "asc",
          },

          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }),

  getCities: publicProcedure.query(async ({ ctx }) => {
    const places = await ctx.prisma.place.findMany({
      where: {
        placeCity: {
          not: null,
        },
      },

      distinct: ["placeCity"],

      select: {
        placeCity: true,
        placeProvince: true,
      },

      orderBy: {
        placeCity: "asc",
      },
    });

    return places
      .filter(
        (
          item,
        ): item is {
          placeCity: string;
          placeProvince: string | null;
        } => Boolean(item.placeCity),
      )
      .map((item) => ({
        city: item.placeCity,
        province: item.placeProvince,
      }));
  }),
});
