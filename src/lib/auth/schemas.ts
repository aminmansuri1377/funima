import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(10, "شماره تلفن معتبر نیست")
  .max(15, "شماره تلفن معتبر نیست");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "نام و نام خانوادگی کوتاه است")
  .max(100, "نام و نام خانوادگی طولانی است");

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "کد تایید باید ۵ رقمی باشد");

export const authRoleSchema = z.enum(["VISITOR", "HOST", "ADMIN"]);

export const requestOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const signupCredentialsSchema = z.object({
  phoneNumber: phoneNumberSchema,
  fullName: fullNameSchema,
  code: otpCodeSchema,
  role: authRoleSchema,
});

export const loginCredentialsSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: otpCodeSchema,
  role: authRoleSchema,
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export type SignupCredentialsInput = z.infer<typeof signupCredentialsSchema>;

export type LoginCredentialsInput = z.infer<typeof loginCredentialsSchema>;
export const nextAuthCredentialsSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: otpCodeSchema,
  role: authRoleSchema,
  fullName: fullNameSchema.optional(),
});
