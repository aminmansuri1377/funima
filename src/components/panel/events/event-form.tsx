"use client";

import { useState } from "react";

import {
  Button,
  FormField,
  InlineMessage,
  Input,
  Text,
  Textarea,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

type EventInitialValues = {
  placeId?: string;
  eventName?: string;
  date?: string;
  hour?: string;
  price?: string;
  description?: string;
  rule?: string;
  info?: string;
  suitable?: string;
};

type EventFormProps = {
  initialValues?: EventInitialValues;

  loading?: boolean;

  submitLabel: string;

  onSubmit: (values: {
    placeId: string;
    eventName: string;
    date: string;
    hour: string;
    price: string;
    description: string;
    rule: string;
    info: string;
    suitable: string;
  }) => Promise<void>;
};

export function EventForm({
  initialValues,
  loading = false,
  submitLabel,
  onSubmit,
}: EventFormProps) {
  const places = trpc.panel.events.places.useQuery();

  const [placeId, setPlaceId] = useState(initialValues?.placeId ?? "");

  const [eventName, setEventName] = useState(initialValues?.eventName ?? "");

  const [date, setDate] = useState(initialValues?.date ?? "");

  const [hour, setHour] = useState(initialValues?.hour ?? "");

  const [price, setPrice] = useState(initialValues?.price ?? "");

  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );

  const [rule, setRule] = useState(initialValues?.rule ?? "");

  const [info, setInfo] = useState(initialValues?.info ?? "");

  const [suitable, setSuitable] = useState(initialValues?.suitable ?? "");

  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!placeId) {
      setError("لطفاً مکان را انتخاب کنید.");

      return;
    }

    if (!eventName.trim()) {
      setError("نام رویداد الزامی است.");

      return;
    }

    if (!date) {
      setError("تاریخ رویداد الزامی است.");

      return;
    }

    try {
      await onSubmit({
        placeId,
        eventName,
        date,
        hour,
        price,
        description,
        rule,
        info,
        suitable,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ذخیره رویداد انجام نشد.",
      );
    }
  }

  return (
    <form
      onSubmit={submit}
      className="
        rounded-xl
        border border-(--color-border)
        bg-(--color-surface)
        p-5
      "
    >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="مکان" required>
          <select
            value={placeId}
            onChange={(event) => setPlaceId(event.target.value)}
            disabled={loading || places.isPending}
            className="
              h-14 w-full
              rounded-(--radius-full)
              border
              border-(--color-border-strong)
              bg-white px-5
              outline-none
            "
          >
            <option value="">انتخاب مکان</option>

            {places.data?.map((place) => (
              <option key={place.id} value={place.id}>
                {place.placeName}
                {" — "}
                {place.placeCity ?? "بدون شهر"}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="نام رویداد" required>
          <Input
            value={eventName}
            onChange={(event) => setEventName(event.target.value)}
            placeholder="نام رویداد"
          />
        </FormField>

        <FormField label="تاریخ" required>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            dir="ltr"
          />
        </FormField>

        <FormField label="ساعت">
          <Input
            type="time"
            value={hour}
            onChange={(event) => setHour(event.target.value)}
            dir="ltr"
          />
        </FormField>

        <FormField label="قیمت">
          <Input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="decimal"
            dir="ltr"
            placeholder="مثلاً 250000"
          />
        </FormField>

        <FormField label="مناسب برای">
          <Input
            value={suitable}
            onChange={(event) => setSuitable(event.target.value)}
            placeholder="مثلاً همه سنین"
          />
        </FormField>
      </div>

      <FormField label="توضیحات" className="mt-5">
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          resize={false}
        />
      </FormField>

      <FormField label="قوانین" className="mt-5">
        <Textarea
          value={rule}
          onChange={(event) => setRule(event.target.value)}
          resize={false}
        />
      </FormField>

      <FormField label="اطلاعات تکمیلی" className="mt-5">
        <Textarea
          value={info}
          onChange={(event) => setInfo(event.target.value)}
          resize={false}
        />
      </FormField>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}

      <div className="mt-6">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
