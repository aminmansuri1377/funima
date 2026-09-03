"use client";

import { useState } from "react";

import { FiPlus, FiTrash2 } from "react-icons/fi";

import { Button, FormField, InlineMessage, Input, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function FiltersManager() {
  const filters = trpc.panel.filters.list.useQuery();

  const [filterName, setFilterName] = useState("");

  const [error, setError] = useState<string | null>(null);

  const createFilter = trpc.panel.filters.create.useMutation();

  const deleteFilter = trpc.panel.filters.delete.useMutation();

  async function handleCreateFilter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    try {
      await createFilter.mutateAsync({
        name: filterName,
      });

      setFilterName("");

      await filters.refetch();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ایجاد فیلتر انجام نشد.",
      );
    }
  }

  async function handleDeleteFilter(filterId: string, name: string) {
    const confirmed = window.confirm(
      `با حذف فیلتر «${name}» همه گزینه‌های آن نیز حذف خواهند شد. ادامه می‌دهید؟`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteFilter.mutateAsync({
        filterId,
      });

      await filters.refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف فیلتر انجام نشد.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="heading-xl">
          فیلترها
        </Text>

        <Text tone="secondary" className="mt-1">
          گروه‌ها و گزینه‌های قابل انتخاب برای مکان‌ها
        </Text>
      </div>

      <form
        onSubmit={handleCreateFilter}
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-5
        "
      >
        <Text variant="heading-md" className="mb-5">
          ایجاد گروه فیلتر
        </Text>

        <div
          className="
            flex flex-col gap-4
            sm:flex-row sm:items-end
          "
        >
          <FormField label="نام فیلتر" required className="flex-1">
            <Input
              value={filterName}
              onChange={(event) => setFilterName(event.target.value)}
              placeholder="مثلاً تجربه‌هایی که ارائه می‌دهید"
              disabled={createFilter.isPending}
            />
          </FormField>

          <Button
            type="submit"
            loading={createFilter.isPending}
            startIcon={<FiPlus />}
          >
            افزودن فیلتر
          </Button>
        </div>
      </form>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {filters.isPending && (
        <Text tone="secondary">در حال دریافت فیلترها...</Text>
      )}

      {filters.error && (
        <InlineMessage variant="error">
          دریافت فیلترها با خطا مواجه شد.
        </InlineMessage>
      )}

      {filters.data?.map((filter) => (
        <FilterCard
          key={filter.id}
          filter={filter}
          onChanged={() => filters.refetch()}
          onDelete={() => handleDeleteFilter(filter.id, filter.name)}
        />
      ))}

      {filters.data?.length === 0 && (
        <div
          className="
            rounded-xl
            border border-dashed
            border-(--color-border)
            bg-(--color-surface)
            p-10 text-center
          "
        >
          <Text variant="heading-md">هنوز فیلتری ساخته نشده</Text>
        </div>
      )}
    </div>
  );
}

type FilterCardProps = {
  filter: {
    id: string;
    name: string;

    values: Array<{
      id: string;
      name: string;

      _count: {
        places: number;
      };
    }>;
  };

  onChanged: () => void | Promise<unknown>;

  onDelete: () => void;
};

function FilterCard({ filter, onChanged, onDelete }: FilterCardProps) {
  const [newValue, setNewValue] = useState("");

  const [error, setError] = useState<string | null>(null);

  const createValue = trpc.panel.filters.createValue.useMutation();

  const deleteValue = trpc.panel.filters.deleteValue.useMutation();

  async function handleCreateValue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    try {
      await createValue.mutateAsync({
        filterId: filter.id,

        name: newValue,
      });

      setNewValue("");

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "افزودن گزینه انجام نشد.",
      );
    }
  }

  async function handleDeleteValue(id: string, name: string) {
    const confirmed = window.confirm(`گزینه «${name}» حذف شود؟`);

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteValue.mutateAsync({
        filterValueId: id,
      });

      await onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف گزینه انجام نشد.");
    }
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
      <div
        className="
          mb-5 flex
          items-center
          justify-between
          gap-4
        "
      >
        <div>
          <Text variant="heading-md">{filter.name}</Text>

          <Text variant="caption" tone="secondary" className="mt-1">
            {filter.values.length} گزینه
          </Text>
        </div>

        <Button
          type="button"
          size="sm"
          variant="tertiary"
          startIcon={<FiTrash2 />}
          onClick={onDelete}
        >
          حذف فیلتر
        </Button>
      </div>

      {filter.values.length > 0 && (
        <div
          className="
            mb-5 flex
            flex-wrap gap-2
          "
        >
          {filter.values.map((value) => (
            <div
              key={value.id}
              className="
                  inline-flex
                  items-center gap-2
                  rounded-full
                  bg-gray-50
                  px-4 py-2
                "
            >
              <span className="text-sm">{value.name}</span>

              <span
                className="
                    text-xs
                    text-(--color-text-secondary)
                  "
              >
                ({value._count.places})
              </span>

              <button
                type="button"
                aria-label={`حذف ${value.name}`}
                onClick={() => handleDeleteValue(value.id, value.name)}
                className="
                    flex h-5 w-5
                    items-center
                    justify-center
                    rounded-full
                    hover:bg-gray-200
                  "
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleCreateValue}
        className="
          flex flex-col gap-3
          sm:flex-row
        "
      >
        <Input
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          placeholder="گزینه جدید..."
          disabled={createValue.isPending}
        />

        <Button
          type="submit"
          variant="secondary"
          loading={createValue.isPending}
          startIcon={<FiPlus />}
        >
          افزودن گزینه
        </Button>
      </form>

      {error && (
        <InlineMessage variant="error" className="mt-3">
          {error}
        </InlineMessage>
      )}
    </section>
  );
}
