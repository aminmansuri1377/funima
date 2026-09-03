"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  FiArrowDown,
  FiArrowUp,
  FiEdit2,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import { Button, FormField, InlineMessage, Input, Text } from "@/components/ui";

import { EventForm } from "./event-form";

import { trpc } from "@/trpc/client";

type Props = {
  eventId: string;
};

export function EditEventManager({ eventId }: Props) {
  const router = useRouter();

  const event = trpc.panel.events.getById.useQuery({
    eventId,
  });

  if (event.isPending) {
    return <Text tone="secondary">در حال دریافت اطلاعات رویداد...</Text>;
  }

  if (event.error || !event.data) {
    return (
      <InlineMessage variant="error">
        دریافت اطلاعات رویداد با خطا مواجه شد.
      </InlineMessage>
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

type EditEventContentProps = {
  event: {
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

    place: {
      id: string;
      placeName: string;
      placeCity: string | null;
    };

    plans: Array<{
      id: string;
      hour: string | null;
      plan: string;
      sortOrder: number;
    }>;
  };

  onUpdated: () => void | Promise<unknown>;

  onBack: () => void;
};

function EditEventContent({ event, onUpdated, onBack }: EditEventContentProps) {
  const update = trpc.panel.events.update.useMutation();

  const [success, setSuccess] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const dateValue = new Date(event.date).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div
        className="
          flex flex-col gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
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

        <Button type="button" variant="secondary" onClick={onBack}>
          بازگشت
        </Button>
      </div>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {success && <InlineMessage variant="success">{success}</InlineMessage>}

      <EventForm
        initialValues={{
          placeId: event.placeId,

          eventName: event.eventName,

          date: dateValue,

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
            await update.mutateAsync({
              eventId: event.id,

              ...values,
            });

            setSuccess("اطلاعات رویداد با موفقیت ذخیره شد.");

            await onUpdated();
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "ویرایش رویداد انجام نشد.",
            );
          }
        }}
      />

      <EventPlansEditor
        eventId={event.id}
        plans={event.plans}
        onChanged={onUpdated}
      />
    </div>
  );
}

type EventPlansEditorProps = {
  eventId: string;

  plans: Array<{
    id: string;
    hour: string | null;
    plan: string;
    sortOrder: number;
  }>;

  onChanged: () => void | Promise<unknown>;
};

function EventPlansEditor({
  eventId,
  plans,
  onChanged,
}: EventPlansEditorProps) {
  const [hour, setHour] = useState("");

  const [plan, setPlan] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editingHour, setEditingHour] = useState("");

  const [editingPlan, setEditingPlan] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const addPlan = trpc.panel.events.addPlan.useMutation();

  const updatePlan = trpc.panel.events.updatePlan.useMutation();

  const deletePlan = trpc.panel.events.deletePlan.useMutation();

  const reorderPlans = trpc.panel.events.reorderPlans.useMutation();

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!plan.trim()) {
      setError("متن برنامه الزامی است.");

      return;
    }

    try {
      await addPlan.mutateAsync({
        eventId,
        hour,
        plan,
      });

      setHour("");
      setPlan("");

      setSuccess("برنامه با موفقیت اضافه شد.");

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "افزودن برنامه انجام نشد.",
      );
    }
  }

  function startEdit(item: { id: string; hour: string | null; plan: string }) {
    setEditingId(item.id);

    setEditingHour(item.hour ?? "");

    setEditingPlan(item.plan);

    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingHour("");
    setEditingPlan("");
  }

  async function saveEdit() {
    if (!editingId) {
      return;
    }

    setError(null);
    setSuccess(null);

    if (!editingPlan.trim()) {
      setError("متن برنامه الزامی است.");

      return;
    }

    try {
      await updatePlan.mutateAsync({
        planId: editingId,

        hour: editingHour,

        plan: editingPlan,
      });

      cancelEdit();

      setSuccess("برنامه با موفقیت ویرایش شد.");

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ویرایش برنامه انجام نشد.",
      );
    }
  }

  async function handleDelete(planId: string) {
    const confirmed = window.confirm("این برنامه حذف شود؟");

    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await deletePlan.mutateAsync({
        planId,
      });

      if (editingId === planId) {
        cancelEdit();
      }

      setSuccess("برنامه با موفقیت حذف شد.");

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "حذف برنامه انجام نشد.",
      );
    }
  }

  async function movePlan(index: number, direction: "UP" | "DOWN") {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= plans.length) {
      return;
    }

    const ids = plans.map((item) => item.id);

    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];

    setError(null);
    setSuccess(null);

    try {
      await reorderPlans.mutateAsync({
        eventId,
        planIds: ids,
      });

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "تغییر ترتیب برنامه‌ها انجام نشد.",
      );
    }
  }

  const isWorking =
    addPlan.isPending ||
    updatePlan.isPending ||
    deletePlan.isPending ||
    reorderPlans.isPending;

  return (
    <section
      className="
        rounded-[var(--radius-xl)]
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        p-5
      "
    >
      <div className="mb-6">
        <Text variant="heading-md">برنامه رویداد</Text>

        <Text variant="body-sm" tone="secondary" className="mt-1">
          مراحل و زمان‌بندی رویداد را به ترتیب اضافه کنید.
        </Text>
      </div>

      <form
        onSubmit={handleAdd}
        className="
          grid gap-4
          lg:grid-cols-[180px_1fr_auto]
        "
      >
        <FormField label="ساعت">
          <Input
            type="time"
            value={hour}
            onChange={(event) => setHour(event.target.value)}
            dir="ltr"
            disabled={isWorking}
          />
        </FormField>

        <FormField label="برنامه" required>
          <Input
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            placeholder="مثلاً شروع اجرای موسیقی"
            disabled={isWorking}
          />
        </FormField>

        <div className="flex items-end">
          <Button
            type="submit"
            startIcon={<FiPlus />}
            loading={addPlan.isPending}
          >
            افزودن برنامه
          </Button>
        </div>
      </form>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}

      {success && (
        <InlineMessage variant="success" className="mt-4">
          {success}
        </InlineMessage>
      )}

      <div className="mt-8 space-y-3">
        {plans.map((item, index) => {
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
              className="
                  rounded-[var(--radius-lg)]
                  border
                  border-[var(--color-border)]
                  p-4
                "
            >
              {isEditing ? (
                <div className="space-y-4">
                  <div
                    className="
                        grid gap-4
                        md:grid-cols-[180px_1fr]
                      "
                  >
                    <FormField label="ساعت">
                      <Input
                        type="time"
                        value={editingHour}
                        onChange={(event) => setEditingHour(event.target.value)}
                        dir="ltr"
                        disabled={isWorking}
                      />
                    </FormField>

                    <FormField label="برنامه" required>
                      <Input
                        value={editingPlan}
                        onChange={(event) => setEditingPlan(event.target.value)}
                        disabled={isWorking}
                      />
                    </FormField>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      loading={updatePlan.isPending}
                      onClick={saveEdit}
                    >
                      ذخیره
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isWorking}
                      onClick={cancelEdit}
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div
                      className="
                          flex h-10 w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-[var(--color-brand-50)]
                          font-bold
                          text-[var(--color-brand-600)]
                        "
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Text variant="label-lg">{item.plan}</Text>

                      <Text variant="caption" tone="secondary" className="mt-1">
                        {item.hour ? `ساعت ${item.hour}` : "بدون ساعت مشخص"}
                      </Text>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      aria-label="انتقال برنامه به بالا"
                      disabled={index === 0 || isWorking}
                      onClick={() => movePlan(index, "UP")}
                    >
                      <FiArrowUp />
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      aria-label="انتقال برنامه به پایین"
                      disabled={index === plans.length - 1 || isWorking}
                      onClick={() => movePlan(index, "DOWN")}
                    >
                      <FiArrowDown />
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      startIcon={<FiEdit2 />}
                      disabled={isWorking}
                      onClick={() => startEdit(item)}
                    >
                      ویرایش
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="tertiary"
                      startIcon={<FiTrash2 />}
                      disabled={isWorking}
                      onClick={() => handleDelete(item.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {plans.length === 0 && (
          <div
            className="
              rounded-[var(--radius-lg)]
              border
              border-dashed
              border-[var(--color-border)]
              p-8
              text-center
            "
          >
            <Text variant="heading-md">هنوز برنامه‌ای وجود ندارد</Text>

            <Text tone="secondary" className="mt-2">
              اولین مرحله برنامه رویداد را از فرم بالا اضافه کنید.
            </Text>
          </div>
        )}
      </div>
    </section>
  );
}
