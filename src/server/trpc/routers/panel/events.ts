import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../trpc";
import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";
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
            place: {
              select: {
                id: true,
                placeName: true,
                placeCity: true,

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

      const items = events.map((event) => ({
        ...event,

        price: event.price?.toString() ?? null,
      }));

      return {
        items,

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

      const date = new Date(input.date);

      if (Number.isNaN(date.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "تاریخ معتبر نیست.",
        });
      }

      const event = await ctx.prisma.event.create({
        data: {
          placeId: place.id,

          eventName: input.eventName.trim(),

          date,

          hour: input.hour?.trim() || null,

          price: input.price?.trim() || null,

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
      const event = await ctx.prisma.event.findUnique({
        where: {
          id: input.eventId,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "رویداد پیدا نشد.",
        });
      }

      const date = new Date(input.date);

      if (Number.isNaN(date.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "تاریخ معتبر نیست.",
        });
      }

      const updated = await ctx.prisma.event.update({
        where: {
          id: event.id,
        },

        data: {
          placeId: input.placeId,

          eventName: input.eventName.trim(),

          date,

          hour: input.hour?.trim() || null,

          price: input.price?.trim() || null,

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
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "رویداد پیدا نشد.",
        });
      }

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

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_EVENT_PLAN",

            entity: "EventPlan",

            entityId: created.id,

            metadata: {
              eventId: event.id,

              eventName: event.eventName,

              hour: created.hour,

              plan: created.plan,
            },
          },
        });
      } catch (error) {
        console.error("[events.addPlan] AuditLog:", error);
      }

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
      for (let index = 0; index < input.planIds.length; index++) {
        await ctx.prisma.eventPlan.update({
          where: {
            id: input.planIds[index],
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

      const updated = await ctx.prisma.eventPlan.update({
        where: {
          id: existing.id,
        },

        data: {
          hour: input.hour?.trim() || null,

          plan: input.plan.trim(),
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "UPDATE_EVENT_PLAN",

            entity: "EventPlan",

            entityId: updated.id,

            metadata: {
              eventId: updated.eventId,

              hour: updated.hour,

              plan: updated.plan,
            },
          },
        });
      } catch (error) {
        console.error("[events.updatePlan] AuditLog:", error);
      }

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
