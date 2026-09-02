"use client";

import { useState } from "react";

import {
  Button,
  FormField,
  InlineMessage,
  Input,
  OTPInput,
  Text,
  Textarea,
} from "@/components/ui";

export default function UIKitPage() {
  const [otp, setOtp] = useState("");

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
        <Text variant="heading-xl">Typography</Text>

        <Text variant="heading-lg">عنوان نمونه</Text>

        <Text>این یک متن نمونه برای سیستم تایپوگرافی فونیما است.</Text>

        <Text tone="secondary">متن ثانویه</Text>
      </section>
      <section className="space-y-8">
        <Text variant="heading-xl">Buttons</Text>

        <div className="space-y-4">
          <Text variant="heading-md">Primary</Text>

          <div className="flex flex-wrap items-center gap-4">
            <Button size="xl">بزن بریم!</Button>

            <Button size="lg">بزن بریم!</Button>

            <Button size="md">بزن بریم!</Button>

            <Button size="sm">بزن بریم!</Button>
          </div>
        </div>

        <div className="space-y-4">
          <Text variant="heading-md">Secondary</Text>

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" size="xl">
              ثبت نام
            </Button>

            <Button variant="secondary" size="lg">
              ثبت نام
            </Button>

            <Button variant="secondary" size="md">
              ثبت نام
            </Button>

            <Button variant="secondary" size="sm">
              ثبت نام
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Text variant="heading-md">Tertiary</Text>

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="tertiary" size="xl">
              بازگشت
            </Button>

            <Button variant="tertiary" size="lg">
              بازگشت
            </Button>

            <Button variant="tertiary" size="md">
              بازگشت
            </Button>

            <Button variant="tertiary" size="sm">
              بازگشت
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Text variant="heading-md">States</Text>

          <div className="flex flex-wrap items-center gap-4">
            <Button>Default</Button>

            <Button disabled>Disabled</Button>

            <Button loading>Loading</Button>

            <Button variant="danger">حذف</Button>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <Text variant="heading-xl">Form Controls</Text>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            label="شماره تماس"
            description="مثال: 09123456789"
            required
          >
            <Input placeholder="شماره تماس" />
          </FormField>

          <FormField label="نام و نام خانوادگی" success="مقدار معتبر است">
            <Input state="success" defaultValue="امین منصوری" />
          </FormField>

          <FormField label="شماره تماس" error="شماره تماس معتبر نیست">
            <Input state="error" defaultValue="0912" />
          </FormField>

          <FormField label="فیلد غیرفعال">
            <Input disabled value="امکان ویرایش وجود ندارد" readOnly />
          </FormField>
        </div>

        <div className="space-y-4">
          <Text variant="heading-md">Textarea</Text>

          <FormField label="توضیحات" description="حداکثر ۵۰۰ کاراکتر">
            <Textarea placeholder="توضیحات خود را وارد کنید..." />
          </FormField>

          <FormField label="توضیحات" error="توضیحات الزامی است">
            <Textarea state="error" placeholder="توضیحات" />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <Text variant="heading-xl">OTP</Text>

        <OTPInput value={otp} onChange={setOtp} />

        <Text variant="caption" tone="secondary">
          مقدار فعلی: {otp}
        </Text>
      </section>

      <section className="space-y-3">
        <InlineMessage variant="success">
          عملیات با موفقیت انجام شد.
        </InlineMessage>

        <InlineMessage variant="error">کد تایید صحیح نیست.</InlineMessage>

        <InlineMessage variant="warning">
          لطفاً دوباره بررسی کنید.
        </InlineMessage>
      </section>
    </main>
  );
}
