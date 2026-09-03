"use client";

import Image from "next/image";

import { useState } from "react";

import {
  FiArrowDown,
  FiArrowUp,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import { Button, FormField, InlineMessage, Input, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function ShowOnPageManager() {
  const sections = trpc.panel.showOnPage.list.useQuery();

  const places = trpc.panel.showOnPage.availablePlaces.useQuery();

  const [title, setTitle] = useState("");

  const [error, setError] = useState<string | null>(null);

  const createSection = trpc.panel.showOnPage.create.useMutation();

  const reorderSections = trpc.panel.showOnPage.reorderSections.useMutation();

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    try {
      await createSection.mutateAsync({
        title,
      });

      setTitle("");

      await sections.refetch();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ایجاد سکشن انجام نشد.",
      );
    }
  }

  async function moveSection(index: number, direction: "UP" | "DOWN") {
    if (!sections.data) {
      return;
    }

    const target = direction === "UP" ? index - 1 : index + 1;

    if (target < 0 || target >= sections.data.length) {
      return;
    }

    const ids = sections.data.map((item) => item.id);

    [ids[index], ids[target]] = [ids[target], ids[index]];

    await reorderSections.mutateAsync({
      ids,
    });

    await sections.refetch();
  }

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="heading-xl">
          صفحه اصلی
        </Text>

        <Text tone="secondary" className="mt-1">
          سکشن‌ها و مکان‌های نمایش داده شده در Home
        </Text>
      </div>

      <form
        onSubmit={create}
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
            flex flex-col gap-4
            sm:flex-row
            sm:items-end
          "
        >
          <FormField label="عنوان سکشن جدید" required className="flex-1">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثلاً پیشنهاد فونیما"
            />
          </FormField>

          <Button
            type="submit"
            startIcon={<FiPlus />}
            loading={createSection.isPending}
          >
            ایجاد سکشن
          </Button>
        </div>
      </form>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {sections.isPending && (
        <Text tone="secondary">در حال دریافت سکشن‌ها...</Text>
      )}

      {sections.data?.map((section, index) => (
        <SectionEditor
          key={section.id}
          section={section}
          allPlaces={places.data ?? []}
          canMoveUp={index > 0}
          canMoveDown={index < sections.data.length - 1}
          onMoveUp={() => moveSection(index, "UP")}
          onMoveDown={() => moveSection(index, "DOWN")}
          onChanged={() => sections.refetch()}
        />
      ))}
    </div>
  );
}
type SectionEditorProps = {
  section: {
    id: string;
    title: string;
    isActive: boolean;

    places: Array<{
      sortOrder: number;

      place: {
        id: string;
        placeName: string;
        placeCity: string | null;

        images: Array<{
          url: string;
        }>;
      };
    }>;
  };

  allPlaces: Array<{
    id: string;
    placeName: string;
    placeCity: string | null;

    host: {
      user: {
        fullName: string;
      };
    };
  }>;

  canMoveUp: boolean;
  canMoveDown: boolean;

  onMoveUp: () => void;
  onMoveDown: () => void;

  onChanged: () => void | Promise<unknown>;
};

function SectionEditor({
  section,
  allPlaces,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onChanged,
}: SectionEditorProps) {
  const [title, setTitle] = useState(section.title);

  const [selectedPlaceId, setSelectedPlaceId] = useState("");

  const [error, setError] = useState<string | null>(null);

  const update = trpc.panel.showOnPage.update.useMutation();

  const deleteSection = trpc.panel.showOnPage.delete.useMutation();

  const addPlace = trpc.panel.showOnPage.addPlace.useMutation();

  const removePlace = trpc.panel.showOnPage.removePlace.useMutation();

  const reorder = trpc.panel.showOnPage.reorderPlaces.useMutation();

  const selectedIds = new Set(section.places.map((item) => item.place.id));

  const available = allPlaces.filter((place) => !selectedIds.has(place.id));

  async function saveSection() {
    setError(null);

    try {
      await update.mutateAsync({
        id: section.id,

        title,

        isActive: section.isActive,
      });

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ویرایش سکشن انجام نشد.",
      );
    }
  }

  async function toggleActive() {
    setError(null);

    try {
      await update.mutateAsync({
        id: section.id,

        title,

        isActive: !section.isActive,
      });

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "تغییر وضعیت انجام نشد.",
      );
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`سکشن «${section.title}» حذف شود؟`);

    if (!confirmed) {
      return;
    }

    await deleteSection.mutateAsync({
      id: section.id,
    });

    await onChanged();
  }

  async function handleAddPlace() {
    if (!selectedPlaceId) {
      return;
    }

    await addPlace.mutateAsync({
      showOnPageId: section.id,

      placeId: selectedPlaceId,
    });

    setSelectedPlaceId("");

    await onChanged();
  }

  async function handleRemovePlace(placeId: string) {
    await removePlace.mutateAsync({
      showOnPageId: section.id,

      placeId,
    });

    await onChanged();
  }

  async function movePlace(index: number, direction: "UP" | "DOWN") {
    const target = direction === "UP" ? index - 1 : index + 1;

    if (target < 0 || target >= section.places.length) {
      return;
    }

    const ids = section.places.map((item) => item.place.id);

    [ids[index], ids[target]] = [ids[target], ids[index]];

    await reorder.mutateAsync({
      showOnPageId: section.id,

      placeIds: ids,
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
      <div
        className="
          flex flex-col gap-4
          xl:flex-row
          xl:items-center
          xl:justify-between
        "
      >
        <div className="flex-1">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={saveSection}>
            ذخیره عنوان
          </Button>

          <Button
            size="sm"
            variant="secondary"
            startIcon={section.isActive ? <FiEye /> : <FiEyeOff />}
            onClick={toggleActive}
          >
            {section.isActive ? "فعال" : "غیرفعال"}
          </Button>

          <Button
            size="sm"
            variant="tertiary"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            <FiArrowUp />
          </Button>

          <Button
            size="sm"
            variant="tertiary"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            <FiArrowDown />
          </Button>

          <Button
            size="sm"
            variant="tertiary"
            startIcon={<FiTrash2 />}
            onClick={handleDelete}
          >
            حذف
          </Button>
        </div>
      </div>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}

      <div
        className="
          mt-6 flex
          flex-col gap-3
          sm:flex-row
        "
      >
        <select
          value={selectedPlaceId}
          onChange={(event) => setSelectedPlaceId(event.target.value)}
          className="
            h-12 flex-1
            rounded-full
            border
            border-(--color-border)
            bg-white px-4
            outline-none
          "
        >
          <option value="">انتخاب مکان برای افزودن</option>

          {available.map((place) => (
            <option key={place.id} value={place.id}>
              {place.placeName}
              {" — "}
              {place.placeCity ?? "بدون شهر"}
            </option>
          ))}
        </select>

        <Button
          type="button"
          size="lg"
          startIcon={<FiPlus />}
          disabled={!selectedPlaceId}
          loading={addPlace.isPending}
          onClick={handleAddPlace}
        >
          افزودن مکان
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {section.places.map((item, index) => (
          <div
            key={item.place.id}
            className="
                flex items-center
                gap-4
                rounded-lg
                border
                border-(--color-border)
                p-3
              "
          >
            <PlaceThumb
              url={item.place.images[0]?.url ?? null}
              name={item.place.placeName}
            />

            <div className="min-w-0 flex-1">
              <Text variant="label-md">{item.place.placeName}</Text>

              <Text variant="caption" tone="secondary">
                {item.place.placeCity ?? "شهر ثبت نشده"}
              </Text>
            </div>

            <Button
              size="sm"
              variant="tertiary"
              disabled={index === 0}
              onClick={() => movePlace(index, "UP")}
            >
              <FiArrowUp />
            </Button>

            <Button
              size="sm"
              variant="tertiary"
              disabled={index === section.places.length - 1}
              onClick={() => movePlace(index, "DOWN")}
            >
              <FiArrowDown />
            </Button>

            <Button
              size="sm"
              variant="tertiary"
              startIcon={<FiTrash2 />}
              onClick={() => handleRemovePlace(item.place.id)}
            >
              حذف
            </Button>
          </div>
        ))}

        {section.places.length === 0 && (
          <Text tone="secondary" className="py-4 text-center">
            هنوز مکانی به این سکشن اضافه نشده است.
          </Text>
        )}
      </div>
    </section>
  );
}

function PlaceThumb({ url, name }: { url: string | null; name: string }) {
  if (!url) {
    return (
      <div
        className="
          h-14 w-14
          shrink-0
          rounded-md
          bg-gray-100
        "
      />
    );
  }

  return (
    <div
      className="
        relative h-14 w-14
        shrink-0 overflow-hidden
        rounded-md
      "
    >
      <Image src={url} alt={name} fill sizes="56px" className="object-cover" />
    </div>
  );
}
