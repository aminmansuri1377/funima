"use client";

import {
  useState,
} from "react";

import {
  Button,
  FormField,
  InlineMessage,
  Input,
  OTPInput,
  Text,
} from "@/components/ui";

export default function UIKitPage() {
  const [
    otp,
    setOtp,
  ] = useState("");

  return (
    <main
      className="
        mx-auto
        flex
        min-h-screen
        max-w-3xl
        flex-col
        gap-10
        bg-white
        p-10
      "
    >
      <section className="space-y-4">
        <Text variant="heading-xl">
          Typography
        </Text>

        <Text variant="heading-lg">
          عنوان نمونه
        </Text>

        <Text>
          این یک متن نمونه برای سیستم تایپوگرافی فونیما است.
        </Text>

        <Text tone="secondary">
          متن ثانویه
        </Text>
      </section>

      <section className="space-y-4">
        <Text variant="heading-xl">
          Buttons
        </Text>

        <Button>
          بزن بریم!
        </Button>

        <Button variant="secondary">
          ثبت نام
        </Button>

        <Button variant="tertiary">
          بازگشت
        </Button>

        <Button disabled>
          غیرفعال
        </Button>

        <Button loading>
          در حال ارسال
        </Button>
      </section>

      <section className="space-y-4">
        <Text variant="heading-xl">
          Input
        </Text>

        <FormField
          label="شماره تماس"
          description="مثال: 09123456789"
        >
          <Input
            placeholder="شماره تماس"
          />
        </FormField>

        <FormField
          label="نام و نام خانوادگی"
          error="این فیلد الزامی است"
        >
          <Input
            error
            placeholder="نام و نام خانوادگی"
          />
        </FormField>
      </section>

      <section className="space-y-4">
        <Text variant="heading-xl">
          OTP
        </Text>

        <OTPInput
          value={otp}
          onChange={setOtp}
        />

        <Text
          variant="caption"
          tone="secondary"
        >
          مقدار فعلی: {otp}
        </Text>
      </section>

      <section className="space-y-3">
        <InlineMessage variant="success">
          عملیات با موفقیت انجام شد.
        </InlineMessage>

        <InlineMessage variant="error">
          کد تایید صحیح نیست.
        </InlineMessage>

        <InlineMessage variant="warning">
          لطفاً دوباره بررسی کنید.
        </InlineMessage>
      </section>
    </main>
  );
}