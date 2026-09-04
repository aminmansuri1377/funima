"use client";

import { useState } from "react";

import {
  EventImagePicker,
  FormField,
  Input,
  SearchSelect,
  Text,
  Textarea,
  Button,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

export type EventFormValues = {
  placeId: string;

  eventName: string;

  date: string;

  hour: string;

  price: string;

  description: string;

  rule: string;

  info: string;

  suitable: string;

  imageFiles: File[];
};

type Props = {
  initialValues?: Partial<Omit<EventFormValues, "imageFiles">>;

  submitLabel: string;

  loading?: boolean;

  enableImagePicker?: boolean;

  onSubmit: (values: EventFormValues) => void | Promise<void>;
};

export function EventForm({
  initialValues,
  submitLabel,
  loading = false,
  enableImagePicker = false,
  onSubmit,
}: Props) {
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

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      placeId,

      eventName: eventName.trim(),

      date,

      hour: hour.trim(),

      price: normalizeNumberInput(price),

      description: description.trim(),

      rule: rule.trim(),

      info: info.trim(),

      suitable: suitable.trim(),

      imageFiles,
    });
  }

  const placeOptions =
    places.data?.map((place) => ({
      value: place.id,

      label: [place.placeName, place.placeCity].filter(Boolean).join(" - "),
    })) ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-5
        "
      >
        <Text variant="heading-md">اطلاعات رویداد</Text>

        <div className="mt-5 space-y-5">
          <FormField label="مکان" required>
            <SearchSelect
              value={placeId}
              options={placeOptions}
              onChange={setPlaceId}
              placeholder="انتخاب مکان"
              searchPlaceholder="جستجوی مکان..."
              disabled={loading || places.isPending}
            />
          </FormField>

          <FormField label="نام رویداد" required>
            <Input
              value={eventName}
              onChange={(event) => setEventName(event.target.value)}
              disabled={loading}
            />
          </FormField>

          <div className="grid gap-5 md:grid-cols-3">
            <FormField label="تاریخ" required>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                disabled={loading}
              />
            </FormField>

            <FormField label="ساعت">
              <Input
                type="time"
                value={hour}
                onChange={(event) => setHour(event.target.value)}
                disabled={loading}
              />
            </FormField>

            <FormField label="قیمت">
              <Input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="numeric"
                dir="ltr"
                className="text-left"
                disabled={loading}
              />
            </FormField>
          </div>

          <FormField label="معرفی کوتاه">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              resize={false}
              disabled={loading}
            />
          </FormField>

          <FormField label="مناسب چه کسانی است؟">
            <Textarea
              value={suitable}
              onChange={(event) => setSuitable(event.target.value)}
              resize={false}
              disabled={loading}
            />
          </FormField>

          <FormField label="قوانین">
            <Textarea
              value={rule}
              onChange={(event) => setRule(event.target.value)}
              resize={false}
              disabled={loading}
            />
          </FormField>

          <FormField label="اطلاعات تکمیلی">
            <Textarea
              value={info}
              onChange={(event) => setInfo(event.target.value)}
              resize={false}
              disabled={loading}
            />
          </FormField>
        </div>
      </section>

      {enableImagePicker && (
        <section
          className="
            rounded-xl
            border
            border-(--color-border)
            bg-(--color-surface)
            p-5
          "
        >
          <EventImagePicker
            files={imageFiles}
            onChange={setImageFiles}
            maxFiles={8}
          />
        </section>
      )}

      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}

function normalizeNumberInput(value: string) {
  return value
    .replaceAll(",", "")
    .replaceAll("٬", "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .trim();
}
