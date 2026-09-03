"use client";

import { useEffect, useState } from "react";

import { Button, InlineMessage, Text } from "@/components/ui";

import { cn } from "@/lib/cn";

import { trpc } from "@/trpc/client";

type Props = {
  placeId: string;
};

export function PlaceFiltersEditor({ placeId }: Props) {
  const data = trpc.panel.filters.placeOptions.useQuery({
    placeId,
  });

  if (data.isPending) {
    return <Text tone="secondary">در حال دریافت فیلترها...</Text>;
  }

  if (data.error || !data.data) {
    return (
      <InlineMessage variant="error">
        دریافت فیلترهای مکان انجام نشد.
      </InlineMessage>
    );
  }

  return (
    <PlaceFiltersForm
      key={data.data.selectedIds.slice().sort().join("-")}
      placeId={placeId}
      filters={data.data.filters}
      initialSelectedIds={data.data.selectedIds}
      onUpdated={() => data.refetch()}
    />
  );
}

type PlaceFiltersFormProps = {
  placeId: string;

  filters: Array<{
    id: string;
    name: string;

    values: Array<{
      id: string;
      name: string;
    }>;
  }>;

  initialSelectedIds: string[];

  onUpdated: () => void | Promise<unknown>;
};

function PlaceFiltersForm({
  placeId,
  filters,
  initialSelectedIds,
  onUpdated,
}: PlaceFiltersFormProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const update = trpc.panel.filters.setPlaceValues.useMutation();

  function toggle(id: string) {
    setSuccess(null);

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function save() {
    setError(null);
    setSuccess(null);

    try {
      await update.mutateAsync({
        placeId,
        filterValueIds: selectedIds,
      });

      setSuccess("فیلترهای مکان ذخیره شدند.");

      await onUpdated();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ذخیره فیلترها انجام نشد.",
      );
    }
  }

  if (filters.length === 0) {
    return (
      <div>
        <Text variant="heading-md">فیلترهای مکان</Text>

        <Text tone="secondary" className="mt-2">
          ابتدا از بخش «فیلترها» در پنل، گروه و گزینه ایجاد کنید.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <Text variant="heading-md">ویژگی‌ها و فیلترهای مکان</Text>

        <Text variant="body-sm" tone="secondary" className="mt-1">
          گزینه‌هایی را که برای این مکان صدق می‌کنند انتخاب کنید.
        </Text>
      </div>

      {filters.map((filter) => (
        <div key={filter.id}>
          <Text variant="label-lg">{filter.name}</Text>

          <div
            className="
                mt-3 flex
                flex-wrap gap-2
              "
          >
            {filter.values.map((value) => {
              const selected = selectedIds.includes(value.id);

              return (
                <button
                  key={value.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(value.id)}
                  className={cn(
                    "rounded-full",
                    "border px-4 py-2",
                    "text-sm font-semibold",
                    "transition-colors",

                    selected
                      ? [
                          "border-(--color-brand-500)",
                          "bg-(--color-brand-500)",
                          "text-white",
                        ]
                      : [
                          "border-(--color-border)",
                          "bg-white",
                          "text-(--color-text-primary)",
                          "hover:border-(--color-brand-300)",
                        ],
                  )}
                >
                  {value.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {success && <InlineMessage variant="success">{success}</InlineMessage>}

      <Button type="button" loading={update.isPending} onClick={save}>
        ذخیره فیلترها
      </Button>
    </div>
  );
}
