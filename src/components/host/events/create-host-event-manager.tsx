"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiInfo,
  FiPlus,
  FiShield,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";

import {
  Button,
  FormField,
  InlineMessage,
  Input,
  Text,
  Textarea,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

type DraftPlan = {
  id: string;
  hour: string;
  plan: string;
};

export function CreateHostEventManager() {
  const router = useRouter();

  const createEvent = trpc.host.events.create.useMutation();

  const addPlan = trpc.host.events.addPlan.useMutation();

  const [eventName, setEventName] = useState("");

  const [date, setDate] = useState("");

  const [hour, setHour] = useState("");

  const [price, setPrice] = useState("");

  const [description, setDescription] = useState("");

  const [suitable, setSuitable] = useState("");

  const [rule, setRule] = useState("");

  const [info, setInfo] = useState("");

  const [plans, setPlans] = useState<DraftPlan[]>([
    {
      id: createLocalId(),
      hour: "",
      plan: "",
    },
  ]);

  const [error, setError] = useState<string | null>(null);

  function addPlanRow() {
    setPlans((current) => [
      ...current,
      {
        id: createLocalId(),
        hour: "",
        plan: "",
      },
    ]);
  }

  function updatePlan(planId: string, field: "hour" | "plan", value: string) {
    setPlans((current) =>
      current.map((item) =>
        item.id === planId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function removePlan(planId: string) {
    setPlans((current) => {
      if (current.length === 1) {
        return [
          {
            id: createLocalId(),
            hour: "",
            plan: "",
          },
        ];
      }

      return current.filter((item) => item.id !== planId);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (eventName.trim().length < 2) {
      setError("نام ایونت را وارد کنید.");

      return;
    }

    if (!date) {
      setError("تاریخ ایونت را انتخاب کنید.");

      return;
    }

    const validPlans = plans.filter((item) => item.plan.trim().length > 0);

    try {
      const result = await createEvent.mutateAsync({
        eventName: eventName.trim(),

        date,

        hour: hour.trim(),

        price: normalizeNumberInput(price),

        description: description.trim(),

        suitable: suitable.trim(),

        rule: rule.trim(),

        info: info.trim(),
      });

      for (const planItem of validPlans) {
        await addPlan.mutateAsync({
          eventId: result.eventId,

          hour: planItem.hour.trim(),

          plan: planItem.plan.trim(),
        });
      }

      router.replace(`/host/events/${result.eventId}`);

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ساخت ایونت انجام نشد.",
      );
    }
  }

  const loading = createEvent.isPending || addPlan.isPending;

  return (
    <HostEventShell>
      <div className="space-y-5">
        <header
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <button
            type="button"
            onClick={() => router.push("/host")}
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white
              text-xl
              shadow-sm
              transition-colors
              hover:bg-gray-50
            "
            aria-label="بازگشت"
          >
            <FiArrowRight />
          </button>

          <div className="min-w-0 flex-1">
            <Text as="h1" variant="heading-xl">
              اضافه کردن ایونت
            </Text>

            <Text tone="secondary" className="mt-1">
              ایونت جدید مجموعه خود را ثبت کنید
            </Text>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormCard
            number="۱"
            title="اطلاعات اصلی"
            description="نام، زمان و هزینه ایونت"
          >
            <div className="space-y-5">
              <FormField label="نام ایونت" required>
                <Input
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                  placeholder="نام ایونت را بنویسید"
                  disabled={loading}
                />
              </FormField>

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
              >
                <FormField label="تاریخ" required>
                  <Input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    startIcon={<FiCalendar />}
                    disabled={loading}
                  />
                </FormField>

                <FormField label="ساعت">
                  <Input
                    type="time"
                    value={hour}
                    onChange={(event) => setHour(event.target.value)}
                    startIcon={<FiClock />}
                    disabled={loading}
                  />
                </FormField>

                <FormField label="قیمت هر نفر">
                  <Input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    inputMode="numeric"
                    dir="ltr"
                    className="text-left"
                    startIcon={<FiDollarSign />}
                    placeholder="250000"
                    disabled={loading}
                  />
                </FormField>
              </div>

              <FormField label="معرفی کوتاه">
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="در چند جمله ایونت خود را معرفی کنید..."
                  resize={false}
                  disabled={loading}
                />
              </FormField>
            </div>
          </FormCard>

          <FormCard
            number="۲"
            title="مخاطبان ایونت"
            description="این رویداد برای چه کسانی مناسب است؟"
            icon={<FiUsers />}
          >
            <Textarea
              value={suitable}
              onChange={(event) => setSuitable(event.target.value)}
              placeholder="مثلاً مناسب علاقه‌مندان به بازی‌های گروهی، دانشجوها و..."
              resize={false}
              disabled={loading}
            />
          </FormCard>

          <FormCard
            number="۳"
            title="برنامه ایونت"
            description="زمان‌بندی و مراحل رویداد"
          >
            <div className="space-y-4">
              {plans.map((planItem, index) => (
                <div
                  key={planItem.id}
                  className="
                    rounded-[22px]
                    border
                    border-(--color-border)
                    bg-[#fafafa]
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-full
                          bg-(--color-brand-500)
                          text-sm
                          font-bold
                          text-white
                        "
                      >
                        {index + 1}
                      </div>

                      <Text variant="label-lg">برنامه {index + 1}</Text>
                    </div>

                    <button
                      type="button"
                      aria-label="حذف برنامه"
                      onClick={() => removePlan(planItem.id)}
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        text-red-500
                        transition-colors
                        hover:bg-red-50
                      "
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <div
                    className="
                      mt-4
                      grid
                      gap-3
                      sm:grid-cols-[140px_1fr]
                    "
                  >
                    <Input
                      type="time"
                      value={planItem.hour}
                      onChange={(event) =>
                        updatePlan(planItem.id, "hour", event.target.value)
                      }
                      disabled={loading}
                    />

                    <Input
                      value={planItem.plan}
                      onChange={(event) =>
                        updatePlan(planItem.id, "plan", event.target.value)
                      }
                      placeholder="مثلاً پذیرش شرکت‌کنندگان"
                      disabled={loading}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPlanRow}
                disabled={loading}
                className="
                  flex
                  min-h-14
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-[20px]
                  border-2
                  border-dashed
                  border-(--color-border)
                  text-sm
                  font-semibold
                  text-(--color-text-secondary)
                  transition-colors
                  hover:border-(--color-brand-400)
                  hover:bg-(--color-brand-50)
                  hover:text-(--color-brand-600)
                "
              >
                <FiPlus />
                اضافه کردن برنامه
              </button>
            </div>
          </FormCard>

          <FormCard
            number="۴"
            title="قوانین ایونت"
            description="مواردی که شرکت‌کنندگان باید بدانند"
            icon={<FiShield />}
          >
            <Textarea
              value={rule}
              onChange={(event) => setRule(event.target.value)}
              placeholder="قوانین شرکت در ایونت را بنویسید..."
              resize={false}
              disabled={loading}
            />
          </FormCard>

          <FormCard
            number="۵"
            title="درباره ایونت"
            description="هر توضیح تکمیلی که لازم است"
            icon={<FiInfo />}
          >
            <Textarea
              value={info}
              onChange={(event) => setInfo(event.target.value)}
              placeholder="توضیحات تکمیلی ایونت..."
              resize={false}
              disabled={loading}
            />
          </FormCard>

          {error && <InlineMessage variant="error">{error}</InlineMessage>}

          <div
            className="
              sticky
              bottom-3
              z-20
              rounded-3xl
              bg-white/95
              p-2
              shadow-[0_10px_40px_rgba(0,0,0,0.10)]
              backdrop-blur-xl
            "
          >
            <Button
              type="submit"
              size="xl"
              fullWidth
              startIcon={<FiCheck />}
              loading={loading}
            >
              ثبت ایونت
            </Button>
          </div>
        </form>
      </div>
    </HostEventShell>
  );
}

function FormCard({
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
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        sm:p-7
      "
    >
      <div className="mb-6 flex items-start gap-3">
        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
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
        px-3
        py-4
        sm:px-6
        sm:py-7
      "
    >
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </main>
  );
}

function normalizeNumberInput(value: string) {
  return value
    .replaceAll(",", "")
    .replaceAll("٬", "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .trim();
}

function createLocalId() {
  return `${Date.now()}-${Math.random()}`;
}
