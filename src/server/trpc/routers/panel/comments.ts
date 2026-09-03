import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../trpc";

export const panelCommentsRouter = router({
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

      return ctx.prisma.comment.findMany({
        where: search
          ? {
              OR: [
                {
                  content: {
                    contains: search,
                    mode: "insensitive",
                  },
                },

                {
                  user: {
                    fullName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },

                {
                  user: {
                    phoneNumber: {
                      contains: search,
                    },
                  },
                },

                {
                  place: {
                    placeName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },

                {
                  event: {
                    eventName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : undefined,

        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              profileImage: true,
              roles: true,
            },
          },

          place: {
            select: {
              id: true,
              placeName: true,
            },
          },

          event: {
            select: {
              id: true,
              eventName: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 200,
      });
    }),

  delete: adminProcedure
    .input(
      z.object({
        commentId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: {
          id: input.commentId,
        },

        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },

          place: {
            select: {
              id: true,
              placeName: true,
            },
          },

          event: {
            select: {
              id: true,
              eventName: true,
            },
          },
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "کامنت پیدا نشد.",
        });
      }

      await ctx.prisma.comment.delete({
        where: {
          id: comment.id,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_COMMENT",

            entity: "Comment",

            entityId: comment.id,

            metadata: {
              userId: comment.user.id,

              userPhoneNumber: comment.user.phoneNumber,

              placeId: comment.place?.id ?? null,

              placeName: comment.place?.placeName ?? null,

              eventId: comment.event?.id ?? null,

              eventName: comment.event?.eventName ?? null,

              content: comment.content,
            },
          },
        });
      } catch (error) {
        console.error("[panel.comments.delete] AuditLog:", error);
      }

      return {
        success: true,
      };
    }),
});
