import { TRPCError } from "@trpc/server";

import { hostProcedure } from "../../procedures/host";

import { router } from "../../trpc";

async function getHostOrThrow(ctx: {
  prisma: any;

  session: {
    user: {
      id: string;
    };
  };
}) {
  const host = await ctx.prisma.host.findUnique({
    where: {
      userId: ctx.session.user.id,
    },

    select: {
      id: true,

      place: {
        select: {
          id: true,
          placeName: true,
        },
      },
    },
  });

  if (!host) {
    throw new TRPCError({
      code: "FORBIDDEN",

      message: "پروفایل میزبان پیدا نشد.",
    });
  }

  return host;
}

export const hostDashboardRouter = router({
  latestEvent: hostProcedure.query(async ({ ctx }) => {
    const host = await getHostOrThrow(ctx);

    if (!host.place) {
      return null;
    }

    const event = await ctx.prisma.event.findFirst({
      where: {
        placeId: host.place.id,
      },

      include: {
        place: {
          select: {
            id: true,

            placeName: true,

            placeProvince: true,

            placeCity: true,

            images: {
              orderBy: {
                sortOrder: "asc",
              },

              take: 1,

              select: {
                id: true,

                url: true,
              },
            },
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

      orderBy: {
        createdAt: "desc",
      },
    });

    if (!event) {
      return null;
    }

    return {
      ...event,

      price: event.price?.toString() ?? null,
    };
  }),
});
