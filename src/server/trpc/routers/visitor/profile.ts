import { TRPCError } from "@trpc/server";

import { router, visitorProcedure } from "../../trpc";

export const visitorProfileRouter = router({
  me: visitorProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,

        fullName: true,

        phoneNumber: true,

        profileImage: true,

        createdAt: true,

        visitor: {
          select: {
            id: true,

            createdAt: true,
          },
        },

        _count: {
          select: {
            savedPlaces: true,

            savedEvents: true,

            comments: true,
          },
        },
      },
    });

    if (!user || !user.visitor) {
      throw new TRPCError({
        code: "NOT_FOUND",

        message: "پروفایل بازدیدکننده پیدا نشد.",
      });
    }

    return user;
  }),
});
