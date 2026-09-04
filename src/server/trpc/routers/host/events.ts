import { TRPCError } from "@trpc/server";

import { z } from "zod";

import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";

import { eventStorageBucket, supabaseAdmin } from "@/server/supabase/storage";

import { hostProcedure } from "../../procedures/host";

import { router } from "../../trpc";

const eventFieldsSchema = z.object({
  eventName: z.string().trim().min(2, "نام رویداد الزامی است.").max(150),

  date: z.string().trim().min(1, "تاریخ رویداد الزامی است."),

  hour: z.string().trim().optional(),

  price: z.string().trim().optional(),

  description: z.string().trim().optional(),

  rule: z.string().trim().optional(),

  info: z.string().trim().optional(),

  suitable: z.string().trim().optional(),
});

const eventsListSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
});

async function getHostPlaceOrThrow(ctx: {
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

  if (!host.place) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",

      message: "برای مدیریت رویداد ابتدا مکان خود را ثبت کنید.",
    });
  }

  return {
    host,
    place: host.place,
  };
}

function parseEventDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TRPCError({
      code: "BAD_REQUEST",

      message: "تاریخ رویداد معتبر نیست.",
    });
  }

  return date;
}

function normalizePrice(value: string | undefined) {
  const price = value?.trim();

  if (!price) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(price)) {
    throw new TRPCError({
      code: "BAD_REQUEST",

      message: "قیمت واردشده معتبر نیست.",
    });
  }

  return price;
}

async function removeStorageImages(
  images: Array<{
    storagePath: string;
  }>,
) {
  if (images.length === 0) {
    return;
  }

  const result = await supabaseAdmin.storage
    .from(eventStorageBucket)
    .remove(images.map((image) => image.storagePath));

  if (result.error) {
    console.error("[host.events storage remove]", result.error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",

      message: "حذف تصاویر ایونت از Storage انجام نشد.",
    });
  }
}

export const hostEventsRouter = router({
  list: hostProcedure.input(eventsListSchema).query(async ({ ctx, input }) => {
    const { place } = await getHostPlaceOrThrow(ctx);

    const search = input.search?.trim() || undefined;

    const where = {
      placeId: place.id,

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
                suitable: {
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
            ],
          }
        : {}),
    };

    const { skip, take } = getPagination({
      page: input.page,

      pageSize: input.pageSize,
    });

    const [events, total] = await Promise.all([
      ctx.prisma.event.findMany({
        where,

        skip,
        take,

        include: {
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

          place: {
            select: {
              id: true,
              placeName: true,
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

        orderBy: [
          {
            date: "desc",
          },

          {
            createdAt: "desc",
          },
        ],
      }),

      ctx.prisma.event.count({
        where,
      }),
    ]);

    return {
      items: events.map((event) => ({
        ...event,

        price: event.price?.toString() ?? null,
      })),

      pagination: {
        page: input.page,

        pageSize: input.pageSize,

        total,

        totalPages: getTotalPages(total, input.pageSize),
      },
    };
  }),

  getById: hostProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { place } = await getHostPlaceOrThrow(ctx);

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,

          placeId: place.id,
        },

        include: {
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

          place: {
            select: {
              id: true,
              placeName: true,

              placeProvince: true,

              placeCity: true,
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
          },

          _count: {
            select: {
              comments: true,

              savedBy: true,
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "رویداد پیدا نشد.",
        });
      }

      return {
        ...event,

        price: event.price?.toString() ?? null,
      };
    }),

  create: hostProcedure
    .input(eventFieldsSchema)
    .mutation(async ({ ctx, input }) => {
      const { place } = await getHostPlaceOrThrow(ctx);

      const event = await ctx.prisma.event.create({
        data: {
          placeId: place.id,

          eventName: input.eventName.trim(),

          date: parseEventDate(input.date),

          hour: input.hour?.trim() || null,

          price: normalizePrice(input.price),

          description: input.description?.trim() || null,

          rule: input.rule?.trim() || null,

          info: input.info?.trim() || null,

          suitable: input.suitable?.trim() || null,
        },

        select: {
          id: true,
        },
      });

      return {
        success: true,

        eventId: event.id,
      };
    }),

  update: hostProcedure
    .input(
      eventFieldsSchema.extend({
        eventId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { place } = await getHostPlaceOrThrow(ctx);

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,

          placeId: place.id,
        },

        select: {
          id: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "رویداد پیدا نشد.",
        });
      }

      await ctx.prisma.event.update({
        where: {
          id: event.id,
        },

        data: {
          eventName: input.eventName.trim(),

          date: parseEventDate(input.date),

          hour: input.hour?.trim() || null,

          price: normalizePrice(input.price),

          description: input.description?.trim() || null,

          rule: input.rule?.trim() || null,

          info: input.info?.trim() || null,

          suitable: input.suitable?.trim() || null,
        },
      });

      return {
        success: true,
      };
    }),

  delete: hostProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { place } = await getHostPlaceOrThrow(ctx);

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,

          placeId: place.id,
        },

        select: {
          id: true,

          images: {
            select: {
              storagePath: true,
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "رویداد پیدا نشد.",
        });
      }

      await removeStorageImages(event.images);

      await ctx.prisma.event.delete({
        where: {
          id: event.id,
        },
      });

      return {
        success: true,
      };
    }),

  deleteImage: hostProcedure
    .input(
      z.object({
        eventId: z.string().min(1),

        imageId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { place } = await getHostPlaceOrThrow(ctx);

      const image = await ctx.prisma.eventImage.findFirst({
        where: {
          id: input.imageId,

          eventId: input.eventId,

          event: {
            placeId: place.id,
          },
        },

        select: {
          id: true,
          storagePath: true,
        },
      });

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "تصویر ایونت پیدا نشد.",
        });
      }

      await removeStorageImages([image]);

      await ctx.prisma.eventImage.delete({
        where: {
          id: image.id,
        },
      });

      return {
        success: true,
      };
    }),

  addPlan: hostProcedure
    .input(
      z.object({
        eventId: z.string().min(1),

        hour: z.string().trim().optional(),

        plan: z.string().trim().min(1, "متن برنامه الزامی است.").max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { place } = await getHostPlaceOrThrow(ctx);

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,

          placeId: place.id,
        },

        select: {
          id: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "رویداد پیدا نشد.",
        });
      }

      const lastPlan = await ctx.prisma.eventPlan.findFirst({
        where: {
          eventId: event.id,
        },

        orderBy: {
          sortOrder: "desc",
        },

        select: {
          sortOrder: true,
        },
      });

      const plan = await ctx.prisma.eventPlan.create({
        data: {
          eventId: event.id,

          hour: input.hour?.trim() || null,

          plan: input.plan.trim(),

          sortOrder: (lastPlan?.sortOrder ?? -1) + 1,
        },
      });

      return {
        success: true,

        plan,
      };
    }),

  updatePlan: hostProcedure
    .input(
      z.object({
        eventId: z.string().min(1),

        planId: z.string().min(1),

        hour: z.string().trim().optional(),

        plan: z.string().trim().min(1, "متن برنامه الزامی است.").max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { place } = await getHostPlaceOrThrow(ctx);

      const plan = await ctx.prisma.eventPlan.findFirst({
        where: {
          id: input.planId,

          eventId: input.eventId,

          event: {
            placeId: place.id,
          },
        },

        select: {
          id: true,
        },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "برنامه پیدا نشد.",
        });
      }

      await ctx.prisma.eventPlan.update({
        where: {
          id: plan.id,
        },

        data: {
          hour: input.hour?.trim() || null,

          plan: input.plan.trim(),
        },
      });

      return {
        success: true,
      };
    }),

  deletePlan: hostProcedure
    .input(
      z.object({
        eventId: z.string().min(1),

        planId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { place } = await getHostPlaceOrThrow(ctx);

      const plan = await ctx.prisma.eventPlan.findFirst({
        where: {
          id: input.planId,

          eventId: input.eventId,

          event: {
            placeId: place.id,
          },
        },

        select: {
          id: true,
        },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "برنامه رویداد پیدا نشد.",
        });
      }

      await ctx.prisma.eventPlan.delete({
        where: {
          id: plan.id,
        },
      });

      return {
        success: true,
      };
    }),

  reorderPlans: hostProcedure
    .input(
      z.object({
        eventId: z.string().min(1),

        planIds: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { place } = await getHostPlaceOrThrow(ctx);

      const event = await ctx.prisma.event.findFirst({
        where: {
          id: input.eventId,

          placeId: place.id,
        },

        select: {
          id: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "رویداد پیدا نشد.",
        });
      }

      const uniqueIds = Array.from(new Set(input.planIds));

      const plans = await ctx.prisma.eventPlan.findMany({
        where: {
          eventId: event.id,

          id: {
            in: uniqueIds,
          },
        },

        select: {
          id: true,
        },
      });

      if (plans.length !== uniqueIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",

          message: "ترتیب برنامه‌ها معتبر نیست.",
        });
      }

      for (let index = 0; index < uniqueIds.length; index++) {
        await ctx.prisma.eventPlan.update({
          where: {
            id: uniqueIds[index],
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
