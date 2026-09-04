"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  FiArrowRight,
  FiBookmark,
  FiCalendar,
  FiCheck,
  FiClock,
  FiEdit2,
  FiInfo,
  FiMapPin,
  FiMessageCircle,
  FiPlus,
  FiShield,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";

import {
  Button,
  EventImageUploader,
  FormField,
  InlineMessage,
  Input,
  Text,
  Textarea,
  ImageSlider,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

type Props = {
  eventId: string;
};

export function HostEventManager({ eventId }: Props) {
  const router = useRouter();

  const event = trpc.host.events.getById.useQuery({
    eventId,
  });

  if (event.isPending) {
    return (
      <HostEventShell>
        <EventLoading />
      </HostEventShell>
    );
  }

  if (event.error || !event.data) {
    return (
      <HostEventShell>
        <InlineMessage variant="error">
          دریافت اطلاعات ایونت انجام نشد.
        </InlineMessage>
      </HostEventShell>
    );
  }

  return (
    <HostEventContent
      key={event.data.id}
      event={event.data}
      onChanged={() => event.refetch()}
      onBack={() => router.push("/host")}
      onDeleted={() => router.replace("/host")}
    />
  );
}

type EventData = {
  id: string;

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

  place: {
    id: string;

    placeName: string;

    placeProvince: string | null;

    placeCity: string | null;
  };

  plans: Array<{
    id: string;

    hour: string | null;

    plan: string;

    sortOrder: number;
  }>;

  _count: {
    comments: number;
    savedBy: number;
  };
};

function HostEventContent({
  event,
  onChanged,
  onBack,
  onDeleted,
}: {
  event: EventData;

  onChanged: () => void | Promise<unknown>;

  onBack: () => void;

  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteEvent = trpc.host.events.delete.useMutation();

  async function handleDelete() {
    const confirmed = window.confirm(
      `آیا از حذف ایونت «${event.eventName}» مطمئن هستید؟`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteEvent.mutateAsync({
        eventId: event.id,
      });

      onDeleted();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "حذف ایونت انجام نشد.",
      );
    }
  }

  if (editing) {
    return (
      <HostEventEdit
        event={event}
        onChanged={onChanged}
        onCancel={() => setEditing(false)}
        onSaved={async () => {
          await onChanged();

          setEditing(false);
        }}
      />
    );
  }

  // const mainImage = event.images[0]?.url ?? null;

  return (
    <HostEventShell>
      <div className="space-y-4 sm:space-y-5">
        <header className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="بازگشت"
            onClick={onBack}
            className="
              flex h-11 w-11
              items-center justify-center
              rounded-full
              bg-white
              text-xl
              shadow-sm
              hover:bg-gray-50
            "
          >
            <FiArrowRight />
          </button>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            startIcon={<FiEdit2 />}
            onClick={() => setEditing(true)}
          >
            ویرایش
          </Button>
        </header>

        <section
          className="
            overflow-hidden
            rounded-[30px]
            bg-white
            shadow-[0_8px_30px_rgba(0,0,0,0.05)]
          "
        >
          <div className="relative">
            <ImageSlider
              images={event.images.map((image) => ({
                id: image.id,

                url: image.url,

                alt: event.eventName,
              }))}
              alt={event.eventName}
              priority
              aspectClassName="aspect-[4/3] sm:aspect-[16/8]"
              fallback={<FiCalendar size={52} />}
            />

            <DateBadge date={event.date} />
          </div>

          <div className="p-5 sm:p-7">
            <Text as="h1" variant="heading-xl" className="leading-10">
              {event.eventName}
            </Text>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <EventMeta
                icon={<FiCalendar />}
                label="تاریخ"
                value={formatDate(event.date)}
              />

              <EventMeta
                icon={<FiClock />}
                label="ساعت"
                value={event.hour ?? "ثبت نشده"}
              />

              <EventMeta
                icon={<FiMapPin />}
                label="مکان"
                value={event.place.placeName}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div
                className="
                  rounded-[22px]
                  bg-(--color-brand-50)
                  p-4
                "
              >
                <Text variant="caption" tone="secondary">
                  هزینه هر نفر
                </Text>

                <Text
                  variant="heading-md"
                  className="
                    mt-1
                    text-(--color-brand-700)
                  "
                >
                  {event.price
                    ? `${Number(event.price).toLocaleString("fa-IR")} تومان`
                    : "رایگان"}
                </Text>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[210px]">
                <CounterCard
                  icon={<FiMessageCircle />}
                  value={event._count.comments}
                  label="نظر"
                />

                <CounterCard
                  icon={<FiBookmark />}
                  value={event._count.savedBy}
                  label="ذخیره"
                />
              </div>
            </div>
          </div>
        </section>

        {event.description && (
          <ContentSection icon={<FiInfo />} title="معرفی کوتاه">
            {event.description}
          </ContentSection>
        )}

        {event.suitable && (
          <ContentSection
            icon={<FiUsers />}
            title="این ایونت مناسب چه کسانی است؟"
          >
            {event.suitable}
          </ContentSection>
        )}

        <EventPlans
          eventId={event.id}
          plans={event.plans}
          onChanged={onChanged}
        />

        {event.rule && (
          <ContentSection icon={<FiShield />} title="قوانین ایونت">
            {event.rule}
          </ContentSection>
        )}

        {event.info && (
          <ContentSection icon={<FiInfo />} title="درباره ایونت">
            {event.info}
          </ContentSection>
        )}

        <section
          className="
            rounded-[28px]
            border border-red-100
            bg-white
            p-5
            shadow-sm
            sm:p-7
          "
        >
          <Text variant="heading-md">حذف ایونت</Text>

          <Text tone="secondary" className="mt-2">
            با حذف ایونت، تصاویر، برنامه‌ها و اطلاعات وابسته نیز حذف می‌شوند.
          </Text>

          {deleteError && (
            <InlineMessage variant="error" className="mt-4">
              {deleteError}
            </InlineMessage>
          )}

          <Button
            type="button"
            variant="tertiary"
            startIcon={<FiTrash2 />}
            loading={deleteEvent.isPending}
            className="mt-5"
            onClick={handleDelete}
          >
            حذف ایونت
          </Button>
        </section>
      </div>
    </HostEventShell>
  );
}

function EventGallery({
  eventName,
  images,
  date,
}: {
  eventName: string;

  images: EventData["images"];

  date: Date | string;
}) {
  if (images.length === 0) {
    return (
      <div
        className="
          relative
          flex aspect-16/8
          items-center justify-center
          bg-(--color-brand-50)
          text-(--color-brand-500)
        "
      >
        <FiCalendar size={52} />

        <DateBadge date={date} />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-4/3 overflow-hidden sm:aspect-16/8">
        <Image
          src={images[0].url}
          alt={eventName}
          fill
          priority
          sizes="(max-width:768px) 100vw, 850px"
          className="object-cover"
        />

        <DateBadge date={date} />
      </div>

      {images.length > 1 && (
        <div
          className="
            grid grid-cols-4
            gap-2
            p-2
          "
        >
          {images.slice(1, 5).map((image, index) => (
            <div
              key={image.id}
              className="
                    relative
                    aspect-square
                    overflow-hidden
                    rounded-[18px]
                  "
            >
              <Image
                src={image.url}
                alt={`${eventName} ${index + 2}`}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateBadge({ date }: { date: Date | string }) {
  return (
    <div
      className="
        absolute left-4 top-4
        rounded-[18px]
        bg-white/95
        px-4 py-2.5
        text-center
        shadow-sm
        backdrop-blur
      "
    >
      <Text variant="heading-md">{formatDay(date)}</Text>

      <Text variant="caption" tone="secondary">
        {formatMonth(date)}
      </Text>
    </div>
  );
}

function HostEventEdit({
  event,
  onChanged,
  onCancel,
  onSaved,
}: {
  event: EventData;

  onChanged: () => void | Promise<unknown>;

  onCancel: () => void;

  onSaved: () => void | Promise<unknown>;
}) {
  const update = trpc.host.events.update.useMutation();

  const deleteImage = trpc.host.events.deleteImage.useMutation();

  const [eventName, setEventName] = useState(event.eventName);

  const [date, setDate] = useState(toDateInputValue(event.date));

  const [hour, setHour] = useState(event.hour ?? "");

  const [price, setPrice] = useState(event.price ?? "");

  const [description, setDescription] = useState(event.description ?? "");

  const [suitable, setSuitable] = useState(event.suitable ?? "");

  const [rule, setRule] = useState(event.rule ?? "");

  const [info, setInfo] = useState(event.info ?? "");

  const [error, setError] = useState<string | null>(null);

  async function handleDeleteImage(imageId: string) {
    const confirmed = window.confirm("این تصویر ایونت حذف شود؟");

    if (!confirmed) {
      return;
    }

    try {
      await deleteImage.mutateAsync({
        eventId: event.id,
        imageId,
      });

      await onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف تصویر انجام نشد.");
    }
  }

  async function save(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    setError(null);

    try {
      await update.mutateAsync({
        eventId: event.id,

        eventName: eventName.trim(),

        date,

        hour: hour.trim(),

        price: normalizeNumberInput(price),

        description: description.trim(),

        suitable: suitable.trim(),

        rule: rule.trim(),

        info: info.trim(),
      });

      await onSaved();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ویرایش ایونت انجام نشد.",
      );
    }
  }

  return (
    <HostEventShell>
      <form onSubmit={save} className="space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <Text as="h1" variant="heading-xl">
              ویرایش ایونت
            </Text>

            <Text tone="secondary" className="mt-1">
              اطلاعات رویداد خود را تغییر دهید
            </Text>
          </div>

          <Button type="button" size="sm" variant="tertiary" onClick={onCancel}>
            انصراف
          </Button>
        </header>

        <section
          className="
            rounded-[28px]
            bg-white
            p-5
            shadow-sm
            sm:p-7
          "
        >
          <EventImageUploader
            eventId={event.id}
            images={event.images}
            maxFiles={8}
            onUploaded={onChanged}
            onDelete={handleDeleteImage}
          />
        </section>

        <EditFormCard
          number="۱"
          title="اطلاعات اصلی"
          description="نام، تاریخ، ساعت و هزینه"
        >
          <div className="space-y-5">
            <FormField label="نام ایونت" required>
              <Input
                value={eventName}
                onChange={(event) => setEventName(event.target.value)}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="تاریخ" required>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </FormField>

              <FormField label="ساعت">
                <Input
                  type="time"
                  value={hour}
                  onChange={(event) => setHour(event.target.value)}
                />
              </FormField>

              <FormField label="قیمت">
                <Input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  inputMode="numeric"
                  dir="ltr"
                  className="text-left"
                />
              </FormField>
            </div>

            <FormField label="معرفی کوتاه">
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                resize={false}
              />
            </FormField>
          </div>
        </EditFormCard>

        <EditFormCard
          number="۲"
          title="مخاطبان"
          description="این ایونت مناسب چه کسانی است؟"
          icon={<FiUsers />}
        >
          <Textarea
            value={suitable}
            onChange={(event) => setSuitable(event.target.value)}
            resize={false}
          />
        </EditFormCard>

        <EditFormCard
          number="۳"
          title="قوانین"
          description="قوانین شرکت در ایونت"
          icon={<FiShield />}
        >
          <Textarea
            value={rule}
            onChange={(event) => setRule(event.target.value)}
            resize={false}
          />
        </EditFormCard>

        <EditFormCard
          number="۴"
          title="درباره ایونت"
          description="اطلاعات تکمیلی رویداد"
          icon={<FiInfo />}
        >
          <Textarea
            value={info}
            onChange={(event) => setInfo(event.target.value)}
            resize={false}
          />
        </EditFormCard>

        {error && <InlineMessage variant="error">{error}</InlineMessage>}

        <Button
          type="submit"
          size="xl"
          fullWidth
          startIcon={<FiCheck />}
          loading={update.isPending}
        >
          ذخیره تغییرات
        </Button>
      </form>
    </HostEventShell>
  );
}

function EventPlans({
  eventId,
  plans,
  onChanged,
}: {
  eventId: string;

  plans: EventData["plans"];

  onChanged: () => void | Promise<unknown>;
}) {
  const add = trpc.host.events.addPlan.useMutation();

  const remove = trpc.host.events.deletePlan.useMutation();

  const [hour, setHour] = useState("");

  const [plan, setPlan] = useState("");

  const [error, setError] = useState<string | null>(null);

  async function addPlan() {
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

  async function deletePlan(planId: string) {
    const confirmed = window.confirm("این برنامه حذف شود؟");

    if (!confirmed) {
      return;
    }

    try {
      await remove.mutateAsync({
        eventId,
        planId,
      });

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "حذف برنامه انجام نشد.",
      );
    }
  }

  return (
    <section
      className="
        rounded-[28px]
        bg-white
        p-5
        shadow-sm
        sm:p-7
      "
    >
      <Text variant="heading-md">برنامه ایونت</Text>

      {plans.length > 0 && (
        <div className="mt-6 space-y-3">
          {plans.map((item, index) => (
            <div
              key={item.id}
              className="
                  flex items-start
                  gap-4
                  rounded-[22px]
                  bg-gray-50
                  p-4
                "
            >
              <div
                className="
                    flex h-9 w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-(--color-brand-500)
                    text-sm font-bold
                    text-white
                  "
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                {item.hour && (
                  <Text variant="caption" tone="secondary">
                    {item.hour}
                  </Text>
                )}

                <Text className="mt-1">{item.plan}</Text>
              </div>

              <button
                type="button"
                onClick={() => deletePlan(item.id)}
                className="
                    flex h-9 w-9
                    items-center
                    justify-center
                    rounded-full
                    text-red-500
                    hover:bg-red-50
                  "
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
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
          onClick={addPlan}
        >
          افزودن
        </Button>
      </div>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}
    </section>
  );
}

function ContentSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        rounded-[28px]
        bg-white
        p-5
        shadow-sm
        sm:p-7
      "
    >
      <div className="flex items-center gap-3">
        {icon}

        <Text variant="heading-md">{title}</Text>
      </div>

      <Text
        tone="secondary"
        className="
          mt-4
          whitespace-pre-wrap
          leading-8
        "
      >
        {children}
      </Text>
    </section>
  );
}

function EventMeta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        flex items-center
        gap-3
        rounded-[20px]
        bg-gray-50
        p-4
      "
    >
      <div className="text-(--color-brand-500)">{icon}</div>

      <div>
        <Text variant="caption" tone="secondary">
          {label}
        </Text>

        <Text variant="label-md">{value}</Text>
      </div>
    </div>
  );
}

function CounterCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div
      className="
        flex items-center
        justify-center
        gap-2
        rounded-[20px]
        bg-gray-50
        p-3
      "
    >
      <span className="text-(--color-brand-500)">{icon}</span>

      <div>
        <Text variant="label-lg">{value.toLocaleString("fa-IR")}</Text>

        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      </div>
    </div>
  );
}

function EditFormCard({
  number,
  title,
  description,
  icon,
  children,
}: {
  number: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        rounded-[28px]
        bg-white
        p-5
        shadow-sm
        sm:p-7
      "
    >
      <div className="mb-6 flex items-start gap-3">
        <div
          className="
            flex h-11 w-11
            items-center justify-center
            rounded-2xl
            bg-(--color-brand-50)
            font-bold
            text-(--color-brand-600)
          "
        >
          {icon ?? number}
        </div>

        <div>
          <Text variant="heading-md">{title}</Text>

          <Text tone="secondary" className="mt-1">
            {description}
          </Text>
        </div>
      </div>

      {children}
    </section>
  );
}

function HostEventShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="
        min-h-screen
        bg-[#f5f5f5]
        px-3 py-4
        sm:px-6 sm:py-7
      "
    >
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </main>
  );
}

function EventLoading() {
  return <Text tone="secondary">در حال دریافت اطلاعات ایونت...</Text>;
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function formatDay(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
  }).format(new Date(value));
}

function formatMonth(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
  }).format(new Date(value));
}

function toDateInputValue(value: Date | string) {
  const date = new Date(value);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeNumberInput(value: string) {
  return value
    .replaceAll(",", "")
    .replaceAll("٬", "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .trim();
}
