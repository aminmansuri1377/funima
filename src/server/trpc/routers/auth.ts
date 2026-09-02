import { z } from "zod";

import { router, publicProcedure } from "../trpc";

import { requestOtp, normalizePhoneNumber } from "@/server/auth/otp";

const phoneSchema = z
  .string()
  .trim()
  .min(10, "شماره تلفن معتبر نیست")
  .max(15, "شماره تلفن معتبر نیست");

export const authRouter = router({
  requestOtp: publicProcedure
    .input(
      z.object({
        phoneNumber: phoneSchema,
      }),
    )
    .mutation(async ({ input }) => {
      return requestOtp(input.phoneNumber);
    }),

  checkPhone: publicProcedure
    .input(
      z.object({
        phoneNumber: phoneSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      const phoneNumber = normalizePhoneNumber(input.phoneNumber);

      const user = await ctx.prisma.user.findUnique({
        where: {
          phoneNumber,
        },

        select: {
          roles: true,
        },
      });

      return {
        exists: Boolean(user),
      };
    }),
});
