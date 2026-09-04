import { TRPCError } from "@trpc/server";

import { z } from "zod";

import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";

import { router, visitorProcedure } from "../../trpc";

const commentContentSchema = z
  .string()
  .trim()
  .min(2, "متن نظر کوتاه است.")
  .max(2000, "متن نظر بیش از حد طولانی است.");

const createCommentSchema = z
  .object({
    placeId: z.string().min(1).optional(),

    eventId: z.string().min(1).optional(),

    content: commentContentSchema,
  })
  .superRefine((value, ctx) => {
    const hasPlace = Boolean(value.placeId);

    const hasEvent = Boolean(value.eventId);

    if (hasPlace === hasEvent) {
      ctx.addIssue({
        code: "custom",

        path: ["placeId"],

        message: "نظر باید فقط برای یک مکان یا یک ایونت ثبت شود.",
      });
    }
  });

export const visitorCommentsRouter = router({
  mine: visitorProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const where = {
        userId,
      };

      const { skip, take } = getPagination({
        page: input.page,

        pageSize: input.pageSize,
      });

      const [items, total] = await Promise.all([
        ctx.prisma.comment.findMany({
          where,

          skip,

          take,

          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,

            content: true,

            createdAt: true,

            updatedAt: true,

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

            event: {
              select: {
                id: true,

                eventName: true,

                date: true,

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

                place: {
                  select: {
                    id: true,

                    placeName: true,
                  },
                },
              },
            },
          },
        }),

        ctx.prisma.comment.count({
          where,
        }),
      ]);

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

  create: visitorProcedure
    .input(createCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.placeId) {
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
      }

      if (input.eventId) {
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
      }

      const comment = await ctx.prisma.comment.create({
        data: {
          userId,

          placeId: input.placeId ?? null,

          eventId: input.eventId ?? null,

          content: input.content.trim(),
        },

        select: {
          id: true,

          content: true,

          placeId: true,

          eventId: true,

          createdAt: true,

          updatedAt: true,
        },
      });

      return {
        success: true,

        comment,
      };
    }),

  update: visitorProcedure
    .input(
      z.object({
        commentId: z.string().min(1),

        content: commentContentSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const comment = await ctx.prisma.comment.findFirst({
        where: {
          id: input.commentId,

          userId,
        },

        select: {
          id: true,
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "نظر پیدا نشد.",
        });
      }

      const updated = await ctx.prisma.comment.update({
        where: {
          id: comment.id,
        },

        data: {
          content: input.content.trim(),
        },

        select: {
          id: true,

          content: true,

          updatedAt: true,
        },
      });

      return {
        success: true,

        comment: updated,
      };
    }),

  delete: visitorProcedure
    .input(
      z.object({
        commentId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const comment = await ctx.prisma.comment.findFirst({
        where: {
          id: input.commentId,

          userId,
        },

        select: {
          id: true,
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "نظر پیدا نشد.",
        });
      }

      await ctx.prisma.comment.delete({
        where: {
          id: comment.id,
        },
      });

      return {
        success: true,
      };
    }),
});
