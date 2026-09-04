"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  Button,
  EventImageUploader,
  FormField,
  InlineMessage,
  Input,
  Text,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

import { EventForm } from "./event-form";

type Props = {
  eventId: string;
};

export function EditEventManager({ eventId }: Props) {
  const router = useRouter();

  const event = trpc.panel.events.getById.useQuery({
    eventId,
  });

  if (event.isPending) {
    return <Text tone="secondary">در حال دریافت رویداد...</Text>;
  }

  if (event.error || !event.data) {
    return (
      <InlineMessage variant="error">دریافت رویداد انجام نشد.</InlineMessage>
    );
  }

  return (
    <EditEventContent
      key={event.data.id}
      event={event.data}
      onUpdated={() => event.refetch()}
      onBack={() => router.push("/panel/events")}
    />
  );
}

type EditEventData = {
  id: string;

  placeId: string;

  eventName: string;

  date: Date | string;

  hour: string | null;

  price: string | null;

  description: string | null;

  rule: string | null;

  info: string | null;

  suitable: string | null;

  images: Array<{
    id: string;
    url: string;
    sortOrder: number;
  }>;

  plans: Array<{
    id: string;

    hour: string | null;

    plan: string;

    sortOrder: number;
  }>;
};

function EditEventContent({
  event,
  onUpdated,
  onBack,
}: {
  event: EditEventData;

  onUpdated: () => void | Promise<unknown>;

  onBack: () => void;
}) {
  const update = trpc.panel.events.update.useMutation();

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div
        className="
          flex items-start
          justify-between
          gap-4
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            ویرایش رویداد
          </Text>

          <Text tone="secondary" className="mt-1">
            {event.eventName}
          </Text>
        </div>

        <Button type="button" variant="tertiary" onClick={onBack}>
          بازگشت
        </Button>
      </div>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {success && <InlineMessage variant="success">{success}</InlineMessage>}

      <EventForm
        initialValues={{
          placeId: event.placeId,

          eventName: event.eventName,

          date: toDateInputValue(event.date),

          hour: event.hour ?? "",

          price: event.price ?? "",

          description: event.description ?? "",

          rule: event.rule ?? "",

          info: event.info ?? "",

          suitable: event.suitable ?? "",
        }}
        submitLabel="ذخیره تغییرات"
        loading={update.isPending}
        onSubmit={async (values) => {
          setError(null);

          setSuccess(null);

          try {
            const { imageFiles: _imageFiles, ...eventValues } = values;

            await update.mutateAsync({
              eventId: event.id,

              ...eventValues,
            });

            await onUpdated();

            setSuccess("اطلاعات رویداد با موفقیت ذخیره شد.");
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "ویرایش رویداد انجام نشد.",
            );
          }
        }}
      />

      <PanelEventImages
        eventId={event.id}
        images={event.images}
        onChanged={onUpdated}
      />

      <EventPlansEditor
        eventId={event.id}
        plans={event.plans}
        onChanged={onUpdated}
      />
    </div>
  );
}

function PanelEventImages({
  eventId,
  images,
  onChanged,
}: {
  eventId: string;

  images: Array<{
    id: string;
    url: string;
    sortOrder: number;
  }>;

  onChanged: () => void | Promise<unknown>;
}) {
  const deleteImage = trpc.panel.events.deleteImage.useMutation();

  const [error, setError] = useState<string | null>(null);

  return (
    <section
      className="
        rounded-xl
        border
        border-(--color-border)
        bg-(--color-surface)
        p-5
      "
    >
      {error && (
        <InlineMessage variant="error" className="mb-4">
          {error}
        </InlineMessage>
      )}

      <EventImageUploader
        eventId={eventId}
        images={images}
        maxFiles={8}
        onUploaded={onChanged}
        onDelete={async (imageId) => {
          const confirmed = window.confirm("این تصویر حذف شود؟");

          if (!confirmed) {
            return;
          }

          setError(null);

          try {
            await deleteImage.mutateAsync({
              eventId,
              imageId,
            });

            await onChanged();
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "حذف تصویر انجام نشد.",
            );
          }
        }}
      />
    </section>
  );
}

function EventPlansEditor({
  eventId,
  plans,
  onChanged,
}: {
  eventId: string;

  plans: Array<{
    id: string;

    hour: string | null;

    plan: string;

    sortOrder: number;
  }>;

  onChanged: () => void | Promise<unknown>;
}) {
  const add = trpc.panel.events.addPlan.useMutation();

  const update = trpc.panel.events.updatePlan.useMutation();

  const remove = trpc.panel.events.deletePlan.useMutation();

  const reorder = trpc.panel.events.reorderPlans.useMutation();

  const [hour, setHour] = useState("");

  const [plan, setPlan] = useState("");

  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!plan.trim()) {
      setError("متن برنامه را وارد کنید.");

      return;
    }

    setError(null);

    try {
      await add.mutateAsync({
        eventId,

        hour: hour.trim(),

        plan: plan.trim(),
      });

      setHour("");

      setPlan("");

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "افزودن برنامه انجام نشد.",
      );
    }
  }

  async function movePlan(index: number, direction: "up" | "down") {
    const next = [...plans];

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= next.length) {
      return;
    }

    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

    await reorder.mutateAsync({
      eventId,

      planIds: next.map((item) => item.id),
    });

    await onChanged();
  }

  return (
    <section
      className="
        rounded-xl
        border
        border-(--color-border)
        bg-(--color-surface)
        p-5
      "
    >
      <Text variant="heading-md">برنامه‌های رویداد</Text>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}

      <div className="mt-5 space-y-3">
        {plans.map((item, index) => (
          <PlanRow
            key={item.id}
            item={item}
            first={index === 0}
            last={index === plans.length - 1}
            loading={update.isPending || remove.isPending || reorder.isPending}
            onUp={() => movePlan(index, "up")}
            onDown={() => movePlan(index, "down")}
            onSave={async (values) => {
              await update.mutateAsync({
                planId: item.id,

                hour: values.hour,

                plan: values.plan,
              });

              await onChanged();
            }}
            onDelete={async () => {
              const confirmed = window.confirm("این برنامه حذف شود؟");

              if (!confirmed) {
                return;
              }

              await remove.mutateAsync({
                planId: item.id,
              });

              await onChanged();
            }}
          />
        ))}
      </div>

      <div
        className="
          mt-6
          grid gap-3
          md:grid-cols-[150px_1fr_auto]
        "
      >
        <Input
          type="time"
          value={hour}
          onChange={(event) => setHour(event.target.value)}
        />

        <Input
          value={plan}
          onChange={(event) => setPlan(event.target.value)}
          placeholder="برنامه جدید..."
        />

        <Button
          type="button"
          startIcon={<FiPlus />}
          loading={add.isPending}
          onClick={handleAdd}
        >
          افزودن
        </Button>
      </div>
    </section>
  );
}

function PlanRow({
  item,
  first,
  last,
  loading,
  onUp,
  onDown,
  onSave,
  onDelete,
}: {
  item: {
    id: string;

    hour: string | null;

    plan: string;
  };

  first: boolean;

  last: boolean;

  loading: boolean;

  onUp: () => void;

  onDown: () => void;

  onSave: (values: { hour: string; plan: string }) => void | Promise<unknown>;

  onDelete: () => void | Promise<unknown>;
}) {
  const [hour, setHour] = useState(item.hour ?? "");

  const [plan, setPlan] = useState(item.plan);

  return (
    <div
      className="
        rounded-lg
        border
        border-(--color-border)
        bg-gray-50
        p-4
      "
    >
      <div className="grid gap-3 md:grid-cols-[140px_1fr_auto]">
        <Input
          type="time"
          value={hour}
          onChange={(event) => setHour(event.target.value)}
          disabled={loading}
        />

        <Input
          value={plan}
          onChange={(event) => setPlan(event.target.value)}
          disabled={loading}
        />

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading || !plan.trim()}
          onClick={() =>
            onSave({
              hour: hour.trim(),

              plan: plan.trim(),
            })
          }
        >
          ذخیره
        </Button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="tertiary"
          startIcon={<FiArrowUp />}
          disabled={first || loading}
          onClick={onUp}
        >
          بالا
        </Button>

        <Button
          type="button"
          size="sm"
          variant="tertiary"
          startIcon={<FiArrowDown />}
          disabled={last || loading}
          onClick={onDown}
        >
          پایین
        </Button>

        <Button
          type="button"
          size="sm"
          variant="tertiary"
          startIcon={<FiTrash2 />}
          disabled={loading}
          onClick={onDelete}
        >
          حذف
        </Button>
      </div>
    </div>
  );
}

function toDateInputValue(value: Date | string) {
  const date = new Date(value);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
