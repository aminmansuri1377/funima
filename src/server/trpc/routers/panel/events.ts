import { TRPCError } from "@trpc/server";

import { z } from "zod";

import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";

import { eventStorageBucket, supabaseAdmin } from "@/server/supabase/storage";

import { adminProcedure, router } from "../../trpc";

const eventInputSchema = z.object({
  placeId: z.string().min(1, "مکان الزامی است"),

  eventName: z.string().trim().min(2, "نام رویداد کوتاه است").max(150),

  date: z.string().min(1, "تاریخ الزامی است"),

  hour: z.string().trim().optional(),

  price: z.string().trim().optional(),

  description: z.string().trim().optional(),

  rule: z.string().trim().optional(),

  info: z.string().trim().optional(),

  suitable: z.string().trim().optional(),
});

const eventsListInputSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
});

function parseDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TRPCError({
      code: "BAD_REQUEST",

      message: "تاریخ معتبر نیست.",
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

      message: "قیمت معتبر نیست.",
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
    console.error("[panel.events storage]", result.error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",

      message: "حذف تصاویر ایونت از Storage انجام نشد.",
    });
  }
}

export const panelEventsRouter = router({
  list: adminProcedure
    .input(eventsListInputSchema)
    .query(async ({ ctx, input }) => {
      const search = input.search?.trim() || undefined;

      const where = search
        ? {
            OR: [
              {
                eventName: {
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
        : {};

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

                placeCity: true,
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
            date: "desc",
          },
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

  places: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.place.findMany({
      select: {
        id: true,
        placeName: true,

        placeCity: true,
      },

      orderBy: {
        placeName: "asc",
      },
    });
  }),

  getById: adminProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: {
          id: input.eventId,
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

  create: adminProcedure
    .input(eventInputSchema)
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

      const event = await ctx.prisma.event.create({
        data: {
          placeId: place.id,

          eventName: input.eventName.trim(),

          date: parseDate(input.date),

          hour: input.hour?.trim() || null,

          price: normalizePrice(input.price),

          description: input.description?.trim() || null,

          rule: input.rule?.trim() || null,

          info: input.info?.trim() || null,

          suitable: input.suitable?.trim() || null,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_EVENT",

            entity: "Event",

            entityId: event.id,

            metadata: {
              eventName: event.eventName,

              placeId: event.placeId,

              placeName: place.placeName,
            },
          },
        });
      } catch (error) {
        console.error("[panel.events.create] AuditLog:", error);
      }

      return {
        success: true,

        eventId: event.id,
      };
    }),

  update: adminProcedure
    .input(
      eventInputSchema.extend({
        eventId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [event, place] = await Promise.all([
        ctx.prisma.event.findUnique({
          where: {
            id: input.eventId,
          },
        }),

        ctx.prisma.place.findUnique({
          where: {
            id: input.placeId,
          },

          select: {
            id: true,
          },
        }),
      ]);

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "رویداد پیدا نشد.",
        });
      }

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "مکان پیدا نشد.",
        });
      }

      const updated = await ctx.prisma.event.update({
        where: {
          id: event.id,
        },

        data: {
          placeId: place.id,

          eventName: input.eventName.trim(),

          date: parseDate(input.date),

          hour: input.hour?.trim() || null,

          price: normalizePrice(input.price),

          description: input.description?.trim() || null,

          rule: input.rule?.trim() || null,

          info: input.info?.trim() || null,

          suitable: input.suitable?.trim() || null,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "UPDATE_EVENT",

            entity: "Event",

            entityId: updated.id,

            metadata: {
              eventName: updated.eventName,
            },
          },
        });
      } catch (error) {
        console.error("[panel.events.update] AuditLog:", error);
      }

      return {
        success: true,
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: {
          id: input.eventId,
        },

        select: {
          id: true,
          eventName: true,

          placeId: true,

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

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_EVENT",

            entity: "Event",

            entityId: event.id,

            metadata: {
              eventName: event.eventName,

              placeId: event.placeId,
            },
          },
        });
      } catch (error) {
        console.error("[panel.events.delete] AuditLog:", error);
      }

      return {
        success: true,
      };
    }),

  deleteImage: adminProcedure
    .input(
      z.object({
        eventId: z.string().min(1),

        imageId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.prisma.eventImage.findFirst({
        where: {
          id: input.imageId,

          eventId: input.eventId,
        },

        select: {
          id: true,
          storagePath: true,
        },
      });

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "تصویر پیدا نشد.",
        });
      }

      await removeStorageImages([image]);

      await ctx.prisma.eventImage.delete({
        where: {
          id: image.id,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_EVENT_IMAGE",

            entity: "EventImage",

            entityId: image.id,

            metadata: {
              eventId: input.eventId,

              storagePath: image.storagePath,
            },
          },
        });
      } catch (error) {
        console.error("[panel.events.deleteImage]", error);
      }

      return {
        success: true,
      };
    }),

  addPlan: adminProcedure
    .input(
      z.object({
        eventId: z.string().min(1),

        hour: z.string().trim().optional(),

        plan: z.string().trim().min(1, "متن برنامه الزامی است").max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: {
          id: input.eventId,
        },

        select: {
          id: true,
          eventName: true,
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

      const created = await ctx.prisma.eventPlan.create({
        data: {
          eventId: event.id,

          hour: input.hour?.trim() || null,

          plan: input.plan.trim(),

          sortOrder: (lastPlan?.sortOrder ?? -1) + 1,
        },
      });

      return {
        success: true,

        plan: created,
      };
    }),

  reorderPlans: adminProcedure
    .input(
      z.object({
        eventId: z.string().min(1),

        planIds: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ids = Array.from(new Set(input.planIds));

      const plans = await ctx.prisma.eventPlan.findMany({
        where: {
          eventId: input.eventId,

          id: {
            in: ids,
          },
        },

        select: {
          id: true,
        },
      });

      if (plans.length !== ids.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",

          message: "ترتیب برنامه‌ها معتبر نیست.",
        });
      }

      for (let index = 0; index < ids.length; index++) {
        await ctx.prisma.eventPlan.update({
          where: {
            id: ids[index],
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

  updatePlan: adminProcedure
    .input(
      z.object({
        planId: z.string().min(1),

        hour: z.string().trim().optional(),

        plan: z.string().trim().min(1, "متن برنامه الزامی است").max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.eventPlan.findUnique({
        where: {
          id: input.planId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "برنامه پیدا نشد.",
        });
      }

      await ctx.prisma.eventPlan.update({
        where: {
          id: existing.id,
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

  deletePlan: adminProcedure
    .input(
      z.object({
        planId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.prisma.eventPlan.findUnique({
        where: {
          id: input.planId,
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
});
