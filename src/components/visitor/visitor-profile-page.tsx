"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import type { inferRouterOutputs } from "@trpc/server";
import { usePlaceSave } from "@/hooks/visitor/use-place-save";

import { useEventSave } from "@/hooks/visitor/use-event-save";
import {
  FiBookmark,
  FiCalendar,
  FiEdit2,
  FiMessageCircle,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";

import {
  Button,
  InlineMessage,
  Pagination,
  Text,
  Textarea,
} from "@/components/ui";

import { LogoutButton } from "@/components/auth/logout-button";

import type { AppRouter } from "@/server/trpc/root";

import { trpc } from "@/trpc/client";

import { EventCard } from "./event-card";

import { PlaceCard } from "./place-card";

import { VisitorFooter } from "./visitor-footer";

import { VisitorPageShell } from "./visitor-page-shell";

type RouterOutputs = inferRouterOutputs<AppRouter>;

type ProfileData = RouterOutputs["visitor"]["profile"]["me"];

type SavedPlaceData =
  RouterOutputs["visitor"]["saved"]["places"]["items"][number];

type SavedEventData =
  RouterOutputs["visitor"]["saved"]["events"]["items"][number];

type MyCommentData =
  RouterOutputs["visitor"]["comments"]["mine"]["items"][number];

type ProfileTab = "places" | "events" | "comments";

export function VisitorProfilePage() {
  const [tab, setTab] = useState<ProfileTab>("places");

  const profile = trpc.visitor.profile.me.useQuery();

  if (profile.isPending) {
    return (
      <VisitorPageShell maxWidth="wide">
        <ProfileLoading />
      </VisitorPageShell>
    );
  }

  if (profile.error || !profile.data) {
    return (
      <VisitorPageShell maxWidth="wide">
        <InlineMessage variant="error">
          دریافت اطلاعات پروفایل انجام نشد.
        </InlineMessage>
      </VisitorPageShell>
    );
  }

  return (
    <VisitorPageShell maxWidth="wide">
      <div className="space-y-6">
        <ProfileHeader profile={profile.data} />

        <ProfileTabs tab={tab} profile={profile.data} onChange={setTab} />

        {tab === "places" && <SavedPlaces />}

        {tab === "events" && <SavedEvents />}

        {tab === "comments" && <MyComments />}

        <VisitorFooter />
      </div>
    </VisitorPageShell>
  );
}

function ProfileHeader({ profile }: { profile: ProfileData }) {
  return (
    <section
      className="
        p-5
        sm:p-7
      "
    >
      <div>
        <div className="text-center mx-auto">
          <ProfileAvatar name={profile.fullName} image={profile.profileImage} />

          <div className="">
            <Text as="h1" variant="heading-xl" className="truncate">
              {profile.fullName}
            </Text>

            <Text
              dir="ltr"
              tone="secondary"
              className="
                mt-1
              "
            >
              {profile.phoneNumber}
            </Text>

            {/* <Text variant="caption" tone="secondary" className="mt-1">
              عضو فونیما از {formatJoinDate(profile.createdAt)}
            </Text> */}

            <div className="shrink-0 text-red-500">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div
        className="
          mt-6
          grid
          grid-cols-3
          gap-2
        "
      >
        <ProfileCount
          icon={<FiBookmark />}
          value={profile._count.savedPlaces}
          label="مکان"
        />

        <ProfileCount
          icon={<FiCalendar />}
          value={profile._count.savedEvents}
          label="ایونت"
        />

        <ProfileCount
          icon={<FiMessageCircle />}
          value={profile._count.comments}
          label="نظر"
        />
      </div>
    </section>
  );
}

function ProfileTabs({
  tab,
  profile,
  onChange,
}: {
  tab: ProfileTab;

  profile: ProfileData;

  onChange: (tab: ProfileTab) => void;
}) {
  return (
    <nav
      className="
        sticky
        top-3
        z-30
        rounded-3xl
        border
        border-black/5
        bg-white/95
        p-1.5
        shadow-[0_8px_30px_rgba(0,0,0,0.05)]
        backdrop-blur-xl
      "
    >
      <div
        className="
          grid
          grid-cols-3
          gap-1
        "
      >
        <ProfileTabButton
          active={tab === "places"}
          icon={<FiBookmark />}
          count={profile._count.savedPlaces}
          onClick={() => onChange("places")}
        >
          مکان‌ها
        </ProfileTabButton>

        <ProfileTabButton
          active={tab === "events"}
          icon={<FiCalendar />}
          count={profile._count.savedEvents}
          onClick={() => onChange("events")}
        >
          ایونت‌ها
        </ProfileTabButton>

        <ProfileTabButton
          active={tab === "comments"}
          icon={<FiMessageCircle />}
          count={profile._count.comments}
          onClick={() => onChange("comments")}
        >
          نظرات
        </ProfileTabButton>
      </div>
    </nav>
  );
}

function ProfileTabButton({
  active,
  icon,
  count,
  children,
  onClick,
}: {
  active: boolean;

  icon: React.ReactNode;

  count: number;

  children: React.ReactNode;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`
        flex
        min-h-14
        items-center
        justify-center
        gap-2
        rounded-[19px]
        px-2
        text-xs
        font-semibold
        transition-colors
        sm:text-sm

        ${
          active
            ? "bg-(--color-brand-500) text-white"
            : "text-(--color-text-secondary) hover:bg-gray-50"
        }
      `}
    >
      {/* <span className="text-lg">{icon}</span> */}

      <span>{children}</span>

      {/* <span
        className={`
          flex
          min-w-6
          items-center
          justify-center
          rounded-full
          px-1.5
          py-0.5
          text-[10px]

          ${
            active
              ? "bg-white/20 text-white"
              : "bg-gray-100 text-(--color-text-secondary)"
          }
        `}
      >
        {count.toLocaleString("fa-IR")}
      </span> */}
    </button>
  );
}

/* =====================================================
 * SAVED PLACES
 * ===================================================== */

function SavedPlaces() {
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [error, setError] = useState<string | null>(null);

  const saved = trpc.visitor.saved.places.useQuery({
    page,
    pageSize,
  });

  const placeSave = usePlaceSave();
  async function handleSaveChange(placeId: string, nextSaved: boolean) {
    setError(null);

    try {
      await placeSave.toggle(placeId, nextSaved);

      /*
       * فقط برای edge case Pagination.
       * خود cache قبلاً invalidate شده.
       */
      if (
        !nextSaved &&
        saved.data &&
        saved.data.items.length === 1 &&
        page > 1
      ) {
        setPage((current) => Math.max(current - 1, 1));
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "تغییر وضعیت ذخیره مکان انجام نشد.",
      );

      throw error;
    }
  }

  if (saved.isPending) {
    return <CardsLoading />;
  }

  if (saved.error) {
    return (
      <InlineMessage variant="error">
        دریافت مکان‌های ذخیره‌شده انجام نشد.
      </InlineMessage>
    );
  }

  const items = saved.data?.items ?? [];

  return (
    <section className="space-y-5">
      <SectionHeader
        title="مکان‌های ذخیره‌شده"
        description="جاهایی که برای بعد ذخیره کرده‌ای"
      />

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {items.length === 0 ? (
        <EmptySaved
          icon={<FiBookmark />}
          title="هنوز مکانی ذخیره نکرده‌ای"
          description="هر مکانی که ذخیره کنی، اینجا نمایش داده می‌شود."
        />
      ) : (
        <>
          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {items.map((place: SavedPlaceData) => (
              <PlaceCard
                key={place.id}
                place={place}
                onSaveChange={handleSaveChange}
              />
            ))}
          </div>

          {saved.data && saved.data.pagination.totalPages > 1 && (
            <PaginationBox>
              <Pagination
                page={saved.data.pagination.page}
                pageSize={saved.data.pagination.pageSize}
                totalItems={saved.data.pagination.total}
                totalPages={saved.data.pagination.totalPages}
                disabled={saved.isFetching}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);

                  setPage(1);
                }}
              />
            </PaginationBox>
          )}
        </>
      )}
    </section>
  );
}

/* =====================================================
 * SAVED EVENTS
 * ===================================================== */

function SavedEvents() {
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [error, setError] = useState<string | null>(null);

  const saved = trpc.visitor.saved.events.useQuery({
    page,
    pageSize,
  });

  const eventSave = useEventSave();
  async function handleSaveChange(eventId: string, nextSaved: boolean) {
    setError(null);

    try {
      await eventSave.toggle(eventId, nextSaved);

      if (
        !nextSaved &&
        saved.data &&
        saved.data.items.length === 1 &&
        page > 1
      ) {
        setPage((current) => Math.max(current - 1, 1));
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "تغییر وضعیت ذخیره ایونت انجام نشد.",
      );

      throw error;
    }
  }

  if (saved.isPending) {
    return <CardsLoading />;
  }

  if (saved.error) {
    return (
      <InlineMessage variant="error">
        دریافت ایونت‌های ذخیره‌شده انجام نشد.
      </InlineMessage>
    );
  }

  const items = saved.data?.items ?? [];

  return (
    <section className="space-y-5">
      <SectionHeader
        title="ایونت‌های ذخیره‌شده"
        description="ایونت‌هایی که نمی‌خوای از دست بدی"
      />

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {items.length === 0 ? (
        <EmptySaved
          icon={<FiCalendar />}
          title="هنوز ایونتی ذخیره نکرده‌ای"
          description="ایونت‌های موردعلاقه‌ات را ذخیره کن تا اینجا ببینی."
        />
      ) : (
        <>
          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {items.map((event: SavedEventData) => (
              <EventCard
                key={event.id}
                event={event}
                onSaveChange={handleSaveChange}
              />
            ))}
          </div>

          {saved.data && saved.data.pagination.totalPages > 1 && (
            <PaginationBox>
              <Pagination
                page={saved.data.pagination.page}
                pageSize={saved.data.pagination.pageSize}
                totalItems={saved.data.pagination.total}
                totalPages={saved.data.pagination.totalPages}
                disabled={saved.isFetching}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);

                  setPage(1);
                }}
              />
            </PaginationBox>
          )}
        </>
      )}
    </section>
  );
}

/* =====================================================
 * MY COMMENTS
 * ===================================================== */

function MyComments() {
  const router = useRouter();

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editingContent, setEditingContent] = useState("");

  const [error, setError] = useState<string | null>(null);

  const comments = trpc.visitor.comments.mine.useQuery({
    page,
    pageSize,
  });

  const update = trpc.visitor.comments.update.useMutation();

  const remove = trpc.visitor.comments.delete.useMutation();

  function openCommentTarget(comment: MyCommentData) {
    if (comment.place) {
      router.push(`/places/${comment.place.id}`);

      return;
    }

    if (comment.event) {
      router.push(`/events/${comment.event.id}`);
    }
  }

  function startEditing(comment: MyCommentData) {
    setEditingId(comment.id);

    setEditingContent(comment.content);

    setError(null);
  }

  function cancelEditing() {
    setEditingId(null);

    setEditingContent("");
  }

  async function handleUpdate(commentId: string) {
    const value = editingContent.trim();

    if (value.length < 2) {
      setError("متن نظر را وارد کنید.");

      return;
    }

    setError(null);

    try {
      await update.mutateAsync({
        commentId,

        content: value,
      });

      cancelEditing();

      await comments.refetch();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ویرایش نظر انجام نشد.",
      );
    }
  }

  async function handleDelete(commentId: string) {
    const confirmed = window.confirm("این نظر حذف شود؟");

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await remove.mutateAsync({
        commentId,
      });

      const result = await comments.refetch();

      if (page > 1 && result.data && result.data.items.length === 0) {
        setPage((current) => Math.max(current - 1, 1));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف نظر انجام نشد.");
    }
  }

  if (comments.isPending) {
    return <CommentsLoading />;
  }

  if (comments.error) {
    return (
      <InlineMessage variant="error">دریافت نظرات انجام نشد.</InlineMessage>
    );
  }

  const items = comments.data?.items ?? [];

  return (
    <section className="space-y-5">
      <SectionHeader
        title="نظرات من"
        description="نظرهایی که برای مکان‌ها و ایونت‌ها ثبت کرده‌ای"
      />

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {items.length === 0 ? (
        <EmptySaved
          icon={<FiMessageCircle />}
          title="هنوز نظری ثبت نکرده‌ای"
          description="نظرهایی که در فونیما می‌نویسی اینجا نمایش داده می‌شوند."
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((comment: MyCommentData) => {
              const isEditing = editingId === comment.id;

              return (
                <article
                  key={comment.id}
                  className="
                      overflow-hidden
                      rounded-[26px]
                      bg-white
                      shadow-[0_6px_24px_rgba(0,0,0,0.04)]
                    "
                >
                  <CommentTargetHeader
                    comment={comment}
                    onOpen={() => openCommentTarget(comment)}
                  />

                  <div className="p-5">
                    {isEditing ? (
                      <div>
                        <Textarea
                          value={editingContent}
                          onChange={(event) =>
                            setEditingContent(event.target.value)
                          }
                          resize={false}
                          disabled={update.isPending}
                        />

                        <div
                          className="
                              mt-3
                              flex
                              gap-2
                            "
                        >
                          <Button
                            type="button"
                            size="sm"
                            loading={update.isPending}
                            onClick={() => handleUpdate(comment.id)}
                          >
                            ذخیره
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="tertiary"
                            startIcon={<FiX />}
                            onClick={cancelEditing}
                            disabled={update.isPending}
                          >
                            انصراف
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Text
                          tone="secondary"
                          className="
                              whitespace-pre-wrap
                              leading-8
                            "
                        >
                          {comment.content}
                        </Text>

                        <div
                          className="
                              mt-5
                              flex
                              flex-wrap
                              items-center
                              justify-between
                              gap-3
                            "
                        >
                          <Text variant="caption" tone="secondary">
                            {formatCommentDate(comment.createdAt)}
                          </Text>

                          <div className="flex gap-1">
                            <CommentButton
                              label="ویرایش"
                              onClick={() => startEditing(comment)}
                            >
                              <FiEdit2 />
                            </CommentButton>

                            <CommentButton
                              label="حذف"
                              danger
                              disabled={remove.isPending}
                              onClick={() => handleDelete(comment.id)}
                            >
                              <FiTrash2 />
                            </CommentButton>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {comments.data && comments.data.pagination.totalPages > 1 && (
            <PaginationBox>
              <Pagination
                page={comments.data.pagination.page}
                pageSize={comments.data.pagination.pageSize}
                totalItems={comments.data.pagination.total}
                totalPages={comments.data.pagination.totalPages}
                disabled={comments.isFetching}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);

                  setPage(1);
                }}
              />
            </PaginationBox>
          )}
        </>
      )}
    </section>
  );
}

function CommentTargetHeader({
  comment,
  onOpen,
}: {
  comment: MyCommentData;

  onOpen: () => void;
}) {
  const image =
    comment.place?.images[0]?.url ?? comment.event?.images[0]?.url ?? null;

  const title =
    comment.place?.placeName ?? comment.event?.eventName ?? "مورد حذف‌شده";

  const subtitle = comment.place
    ? [comment.place.placeProvince, comment.place.placeCity]
        .filter(Boolean)
        .join("، ")
    : comment.event
      ? comment.event.place.placeName
      : "";

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!comment.place && !comment.event}
      className="
        flex
        w-full
        items-center
        gap-3
        border-b
        border-(--color-border)
        bg-[#fafafa]
        p-4
        text-right
        transition-colors
        hover:bg-gray-50
        disabled:cursor-default
      "
    >
      <CommentTargetImage image={image} title={title} />

      <div className="min-w-0">
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <span
            className="
              rounded-full
              bg-(--color-brand-50)
              px-2
              py-1
              text-[10px]
              font-semibold
              text-(--color-brand-700)
            "
          >
            {comment.place ? "مکان" : comment.event ? "ایونت" : "حذف شده"}
          </span>

          <Text variant="label-md" className="truncate">
            {title}
          </Text>
        </div>

        {subtitle && (
          <Text
            variant="caption"
            tone="secondary"
            className="
              mt-1
              truncate
            "
          >
            {subtitle}
          </Text>
        )}
      </div>
    </button>
  );
}

function CommentTargetImage({
  image,
  title,
}: {
  image: string | null;

  title: string;
}) {
  if (image) {
    return (
      <div
        className="
          relative
          h-14
          w-14
          shrink-0
          overflow-hidden
          rounded-3xl
        "
      >
        <Image
          src={image}
          alt={title}
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="
        flex
        h-14
        w-14
        shrink-0
        items-center
        justify-center
        rounded-3xl
        bg-(--color-brand-50)
        text-(--color-brand-500)
      "
    >
      <FiMessageCircle />
    </div>
  );
}

function ProfileAvatar({
  name,
  image,
}: {
  name: string;

  image: string | null;
}) {
  if (image) {
    return (
      <div
        className="
          relative
          h-20
          w-20
          shrink-0
          overflow-hidden
          rounded-full
          border-4
          border-white
          shadow-md
        "
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="80px"
          priority
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="
        flex
        h-20
        w-20
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-(--color-brand-50)
        text-2xl
        font-bold
        text-(--color-brand-600)
      "
    >
      {name.trim().charAt(0) || "؟"}
    </div>
  );
}

function ProfileCount({
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
        flex
        min-h-20
        flex-col
        items-center
        justify-center
        rounded-[20px]
        bg-[#f8f8f8]
        p-3
        text-center
      "
    >
      <span
        className="
          text-lg
          text-(--color-brand-500)
        "
      >
        {icon}
      </span>

      <Text variant="label-lg" className="mt-1">
        {value.toLocaleString("fa-IR")}
      </Text>

      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;

  description: string;
}) {
  return (
    <div>
      {/* <Text as="h2" variant="heading-xl">
        {title}
      </Text> */}

      <Text tone="secondary" className="mt-1">
        {description}
      </Text>
    </div>
  );
}

function EmptySaved({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;

  title: string;

  description: string;
}) {
  return (
    <div
      className="
        rounded-[30px]
        bg-white
        px-5
        py-14
        text-center
        shadow-[0_8px_30px_rgba(0,0,0,0.03)]
      "
    >
      <div
        className="
          mx-auto
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-[22px]
          bg-(--color-brand-50)
          text-2xl
          text-(--color-brand-500)
        "
      >
        {icon}
      </div>

      <Text variant="heading-md" className="mt-5">
        {title}
      </Text>

      <Text
        tone="secondary"
        className="
          mx-auto
          mt-2
          max-w-md
        "
      >
        {description}
      </Text>
    </div>
  );
}

function PaginationBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        rounded-3xl
        bg-white
        p-4
        shadow-sm
      "
    >
      {children}
    </div>
  );
}

function CommentButton({
  label,
  danger = false,
  disabled = false,
  children,
  onClick,
}: {
  label: string;

  danger?: boolean;

  disabled?: boolean;

  children: React.ReactNode;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-full
        transition-colors
        disabled:opacity-50

        ${
          danger
            ? "text-red-500 hover:bg-red-50"
            : "text-(--color-text-secondary) hover:bg-gray-100"
        }
      `}
    >
      {children}
    </button>
  );
}

function CardsLoading() {
  return (
    <div
      className="
        grid
        gap-4
        sm:grid-cols-2
        lg:grid-cols-3
      "
    >
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="
              overflow-hidden
              rounded-3xl
              bg-white
            "
        >
          <div
            className="
                aspect-16/11
                animate-pulse
                bg-gray-100
              "
          />

          <div
            className="
                space-y-3
                p-4
              "
          >
            <div
              className="
                  h-6
                  w-2/3
                  animate-pulse
                  rounded
                  bg-gray-100
                "
            />

            <div
              className="
                  h-4
                  w-1/2
                  animate-pulse
                  rounded
                  bg-gray-100
                "
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentsLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="
              h-40
              animate-pulse
              rounded-[26px]
              bg-white
            "
        />
      ))}
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="space-y-5">
      <div
        className="
          h-56
          animate-pulse
          rounded-3xl
          bg-white
        "
      />

      <div
        className="
          h-16
          animate-pulse
          rounded-3xl
          bg-white
        "
      />

      <CardsLoading />
    </div>
  );
}

function formatJoinDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",

    month: "long",
  }).format(new Date(value));
}

function formatCommentDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",

    month: "long",

    day: "numeric",
  }).format(new Date(value));
}
