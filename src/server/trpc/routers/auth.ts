import { z } from "zod";

import { router, publicProcedure } from "../trpc";
import { requestOtp, verifyOtp } from "@/server/auth/otp";

const phoneSchema = z
  .string()
  .trim()
  .min(10, "شماره تلفن معتبر نیست")
  .max(15, "شماره تلفن معتبر نیست");

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "کد باید ۵ رقمی باشد");

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

  verifyOtp: publicProcedure
    .input(
      z.object({
        phoneNumber: phoneSchema,
        code: otpSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const result = await verifyOtp(input.phoneNumber, input.code);

      if (!result.success) {
        return result;
      }

      const phoneNumber = input.phoneNumber.replace(/\s+/g, "").trim();

      const existingUser = await ctx.prisma.user.findUnique({
        where: {
          phoneNumber,
        },
        include: {
          visitor: true,
          host: true,
        },
      });

      if (existingUser) {
        return {
          success: true as const,
          isNewUser: false,
          user: existingUser,
        };
      }

      const user = await ctx.prisma.user.create({
        data: {
          phoneNumber,
          fullName: "",
          roles: ["VISITOR"],
          visitor: {
            create: {},
          },
        },
        include: {
          visitor: true,
          host: true,
        },
      });

      return {
        success: true as const,
        isNewUser: true,
        user,
      };
    }),
});
