"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import type { inferRouterOutputs } from "@trpc/server";

import {
  FiBookmark,
  FiCalendar,
  FiCamera,
  FiCheck,
  FiEdit2,
  FiHeart,
  FiMessageCircle,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";

import { LogoutButton } from "@/components/auth/logout-button";

import { InlineMessage, Pagination, Text, Textarea } from "@/components/ui";

import { useEventSave } from "@/hooks/visitor/use-event-save";
import { usePlaceSave } from "@/hooks/visitor/use-place-save";

import type { AppRouter } from "@/server/trpc/root";

import { trpc } from "@/trpc/client";

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

/* =====================================================
 * PROFILE PAGE
 * ===================================================== */

export function VisitorProfilePage() {
  const [tab, setTab] = useState<ProfileTab>("places");

  const profile = trpc.visitor.profile.me.useQuery();

  if (profile.isPending) {
    return (
      <VisitorPageShell maxWidth="mobile">
        <ProfileLoading />
      </VisitorPageShell>
    );
  }

  if (profile.error || !profile.data) {
    return (
      <VisitorPageShell maxWidth="mobile">
        <InlineMessage variant="error">
          دریافت اطلاعات پروفایل انجام نشد.
        </InlineMessage>
      </VisitorPageShell>
    );
  }

  return (
    <VisitorPageShell maxWidth="mobile">
      <div>
        {/*
         * ========================================
         * PROFILE
         * ========================================
         */}

        <ProfileHeader profile={profile.data} />

        {/*
         * ========================================
         * TABS
         * ========================================
         */}

        <ProfileTabs tab={tab} profile={profile.data} onChange={setTab} />

        {/*
         * ========================================
         * TAB CONTENT
         * ========================================
         */}

        <div className="mt-7">
          {tab === "places" && <SavedPlaces />}

          {tab === "events" && <SavedEvents />}

          {tab === "comments" && <MyComments />}
        </div>

        {/*
         * ========================================
         * FOOTER
         * ========================================
         */}

        <div className="mt-20">
          <VisitorFooter />
        </div>
      </div>
    </VisitorPageShell>
  );
}

/* =====================================================
 * PROFILE HEADER
 * ===================================================== */

function ProfileHeader({ profile }: { profile: ProfileData }) {
  return (
    <section
      className="
        flex
        flex-col
        items-center
        justify-center
        pt-2
        text-center
      "
    >
      <ProfileAvatar name={profile.fullName} image={profile.profileImage} />

      <Text
        as="h1"
        className="
          mt-5
          max-w-full
          truncate
          text-[25px]
          font-black
          leading-9
          text-[#07111f]

          sm:text-[28px]
        "
      >
        {profile.fullName}
      </Text>

      {/*
       * شماره تلفن را کوچک نگه می‌داریم
       * تا طراحی اصلی به هم نخورد.
       */}

      <Text
        dir="ltr"
        tone="secondary"
        className="
          mt-1
          text-[13px]
          text-[#a0a0a0]
        "
      >
        {profile.phoneNumber}
      </Text>

      {/*
       * Logout functionality حفظ شده.
       */}

      <div
        className="
          mt-3
          text-center

          [&>button]:rounded-full
          [&>button]:px-4
          [&>button]:py-1.5
          [&>button]:text-[12px]
          [&>button]:font-medium
          [&>button]:text-[#9b9b9b]
          [&>button]:transition-colors

          hover:[&>button]:text-red-500
        "
      >
        <LogoutButton />
      </div>
    </section>
  );
}

/* =====================================================
 * PROFILE AVATAR
 * ===================================================== */

function ProfileAvatar({
  name,
  image,
}: {
  name: string;

  image: string | null;
}) {
  return (
    <div
      className="
        relative
        h-[92px]
        w-[92px]
      "
    >
      <div
        className="
          relative
          h-full
          w-full
          overflow-hidden
          rounded-full
          bg-white
        "
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            priority
            sizes="92px"
            className="object-cover"
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              bg-white
              text-[32px]
              text-[#ff6437]
            "
          >
            <FiUser />
          </div>
        )}
      </div>

      {/*
       * فعلاً فقط UI مطابق Figma.
       * چون update profileImage هنوز
       * در Profile API نداریم.
       */}

      <span
        aria-hidden="true"
        className="
          absolute
          -bottom-1
          right-0
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-full
          border-2
          border-[#EDEDED]
          bg-white
          text-[13px]
          text-[#ff6437]
        "
      >
        <FiCamera />
      </span>
    </div>
  );
}

/* =====================================================
 * PROFILE TABS
 * ===================================================== */

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
      aria-label="بخش‌های پروفایل"
      className="
        mt-8
        grid
        grid-cols-3
        gap-1
      "
    >
      <ProfileTabButton
        active={tab === "places"}
        count={profile._count.savedPlaces}
        onClick={() => onChange("places")}
      >
        مکان های ذخیره شده
      </ProfileTabButton>

      <ProfileTabButton
        active={tab === "events"}
        count={profile._count.savedEvents}
        onClick={() => onChange("events")}
      >
        ایونت های من
      </ProfileTabButton>

      <ProfileTabButton
        active={tab === "comments"}
        count={profile._count.comments}
        onClick={() => onChange("comments")}
      >
        نظرات من
      </ProfileTabButton>
    </nav>
  );
}

function ProfileTabButton({
  active,
  count,
  children,
  onClick,
}: {
  active: boolean;

  count: number;

  children: React.ReactNode;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${String(children)} - ${count.toLocaleString("fa-IR")}`}
      onClick={onClick}
      className={`
        relative
        flex
        min-h-[52px]
        items-center
        justify-center
        px-1
        pb-3
        text-center
        text-[12px]
        font-bold
        leading-6
        transition-colors

        sm:text-[14px]

        ${
          active
            ? `
              text-[#ff6437]
            `
            : `
              text-[#9b9b9b]
              hover:text-[#666]
            `
        }
      `}
    >
      {children}

      {active && (
        <span
          className="
            absolute
            inset-x-2
            bottom-0
            h-[2px]
            rounded-full
            bg-[#ff6437]
          "
        />
      )}
    </button>
  );
}

/* =====================================================
 * SAVED PLACES
 * ===================================================== */

function SavedPlaces() {
  const router = useRouter();

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
    <section>
      {error && (
        <div className="mb-5">
          <InlineMessage variant="error">{error}</InlineMessage>
        </div>
      )}

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
              flex
              flex-col
              gap-9
            "
          >
            {items.map((place: SavedPlaceData) => (
              <SavedPlaceCard
                key={place.id}
                place={place}
                saving={placeSave.isPending}
                onOpen={() => router.push(`/places/${place.id}`)}
                onRemove={() => handleSaveChange(place.id, false)}
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
 * SAVED PLACE CARD
 * ===================================================== */

function SavedPlaceCard({
  place,
  saving,
  onOpen,
  onRemove,
}: {
  place: SavedPlaceData;

  saving: boolean;

  onOpen: () => void;

  onRemove: () => void | Promise<unknown>;
}) {
  const image = place.images[0]?.url ?? null;

  return (
    <article>
      <div
        role="link"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();

            onOpen();
          }
        }}
        className="
          group
          relative
          aspect-[2.15/1]
          cursor-pointer
          overflow-hidden
          rounded-[24px]
          bg-gray-200
        "
      >
        {image ? (
          <Image
            src={image}
            alt={place.placeName}
            fill
            sizes="(max-width: 600px) 100vw, 520px"
            className="
              object-cover
              transition-transform
              duration-300
              group-hover:scale-[1.015]
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              bg-white
              text-3xl
              text-[#ff6437]
            "
          >
            <FiBookmark />
          </div>
        )}

        <SavedHeartButton loading={saving} onRemove={onRemove} />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="
          mt-4
          block
          w-full
          text-right
        "
      >
        <Text
          className="
            line-clamp-1
            text-[18px]
            font-medium
            leading-7
            text-[#202020]
          "
        >
          {place.placeName}
        </Text>

        {(place.placeProvince || place.placeCity) && (
          <Text
            className="
              mt-1
              line-clamp-1
              text-[14px]
              text-[#b0b0b0]
            "
          >
            {[place.placeProvince, place.placeCity].filter(Boolean).join(" - ")}
          </Text>
        )}
      </button>
    </article>
  );
}

/* =====================================================
 * SAVED EVENTS
 * ===================================================== */

function SavedEvents() {
  const router = useRouter();

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
    <section>
      {error && (
        <div className="mb-5">
          <InlineMessage variant="error">{error}</InlineMessage>
        </div>
      )}

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
              flex
              flex-col
              gap-9
            "
          >
            {items.map((event: SavedEventData) => (
              <SavedEventCard
                key={event.id}
                event={event}
                saving={eventSave.isPending}
                onOpen={() => router.push(`/events/${event.id}`)}
                onRemove={() => handleSaveChange(event.id, false)}
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
 * SAVED EVENT CARD
 * ===================================================== */

function SavedEventCard({
  event,
  saving,
  onOpen,
  onRemove,
}: {
  event: SavedEventData;

  saving: boolean;

  onOpen: () => void;

  onRemove: () => void | Promise<unknown>;
}) {
  const image = event.images[0]?.url ?? null;

  return (
    <article>
      <div
        role="link"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(keyboardEvent) => {
          if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
            keyboardEvent.preventDefault();

            onOpen();
          }
        }}
        className="
          group
          relative
          aspect-[2.15/1]
          cursor-pointer
          overflow-hidden
          rounded-[24px]
          bg-gray-200
        "
      >
        {image ? (
          <Image
            src={image}
            alt={event.eventName}
            fill
            sizes="(max-width: 600px) 100vw, 520px"
            className="
              object-cover
              transition-transform
              duration-300
              group-hover:scale-[1.015]
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              bg-white
              text-3xl
              text-[#ff6437]
            "
          >
            <FiCalendar />
          </div>
        )}

        <SavedHeartButton loading={saving} onRemove={onRemove} />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="
          mt-4
          block
          w-full
          text-right
        "
      >
        <Text
          className="
            line-clamp-1
            text-[18px]
            font-medium
            leading-7
            text-[#202020]
          "
        >
          {event.eventName}
        </Text>

        <Text
          className="
            mt-1
            line-clamp-1
            text-[14px]
            text-[#b0b0b0]
          "
        >
          {[
            event.place.placeProvince,
            event.place.placeCity,
            event.place.placeName,
          ]
            .filter(Boolean)
            .join(" - ")}
        </Text>
      </button>
    </article>
  );
}

/* =====================================================
 * SAVED HEART
 * ===================================================== */

function SavedHeartButton({
  loading,
  onRemove,
}: {
  loading: boolean;

  onRemove: () => void | Promise<unknown>;
}) {
  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (loading) {
      return;
    }

    await onRemove();
  }

  return (
    <button
      type="button"
      aria-label="حذف از ذخیره‌ها"
      disabled={loading}
      onClick={handleClick}
      className="
        absolute
        right-4
        top-4
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        bg-white
        text-[23px]
        text-[#ff6437]
        shadow-sm
        transition-transform

        hover:scale-105

        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      <FiHeart className="fill-current" />
    </button>
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

      if (editingId === commentId) {
        cancelEditing();
      }

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
    <section>
      {error && (
        <div className="mb-5">
          <InlineMessage variant="error">{error}</InlineMessage>
        </div>
      )}

      {items.length === 0 ? (
        <EmptySaved
          icon={<FiMessageCircle />}
          title="هنوز نظری ثبت نکرده‌ای"
          description="نظرهایی که در فانیما می‌نویسی اینجا نمایش داده می‌شوند."
        />
      ) : (
        <>
          <div
            className="
              flex
              flex-col
              gap-4
            "
          >
            {items.map((comment: MyCommentData) => {
              const isEditing = editingId === comment.id;

              return (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  isEditing={isEditing}
                  editingContent={editingContent}
                  updatePending={update.isPending}
                  deletePending={remove.isPending}
                  onEditingContentChange={setEditingContent}
                  onOpen={() => openCommentTarget(comment)}
                  onEdit={() => startEditing(comment)}
                  onCancel={cancelEditing}
                  onSave={() => handleUpdate(comment.id)}
                  onDelete={() => handleDelete(comment.id)}
                />
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

/* =====================================================
 * COMMENT CARD
 * ===================================================== */

function CommentCard({
  comment,
  isEditing,
  editingContent,
  updatePending,
  deletePending,
  onEditingContentChange,
  onOpen,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  comment: MyCommentData;

  isEditing: boolean;

  editingContent: string;

  updatePending: boolean;

  deletePending: boolean;

  onEditingContentChange: (value: string) => void;

  onOpen: () => void;

  onEdit: () => void;

  onCancel: () => void;

  onSave: () => void | Promise<unknown>;

  onDelete: () => void | Promise<unknown>;
}) {
  const targetName = getCommentTargetName(comment);

  return (
    <article
      className="
        rounded-[24px]
        bg-white
        px-5
        py-5

        sm:px-6
        sm:py-6
      "
    >
      <button
        type="button"
        onClick={onOpen}
        className="
          block
          w-full
          text-right
        "
      >
        <Text
          as="h2"
          className="
            text-[16px]
            font-black
            leading-7
            text-[#151515]

            sm:text-[17px]
          "
        >
          نظر شما درباره {targetName}
        </Text>
      </button>

      {isEditing ? (
        <div className="mt-4">
          <Textarea
            value={editingContent}
            onChange={(event) => onEditingContentChange(event.target.value)}
            resize={false}
            className="
              min-h-[120px]
              bg-[#f8f8f8]
            "
          />

          <div
            className="
              mt-4
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <button
              type="button"
              disabled={updatePending}
              onClick={onSave}
              className="
                inline-flex
                min-h-9
                items-center
                justify-center
                gap-1.5
                rounded-full
                bg-[#ff6437]
                px-4
                text-[12px]
                font-semibold
                text-white

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <FiCheck />

              {updatePending ? "در حال ذخیره..." : "ذخیره"}
            </button>

            <button
              type="button"
              disabled={updatePending}
              onClick={onCancel}
              className="
                inline-flex
                min-h-9
                items-center
                justify-center
                gap-1.5
                rounded-full
                border
                border-[#dedede]
                px-4
                text-[12px]
                font-semibold
                text-[#737373]
              "
            >
              <FiX />
              انصراف
            </button>
          </div>
        </div>
      ) : (
        <>
          <Text
            className="
              mt-4
              whitespace-pre-wrap
              text-[14px]
              leading-8
              text-[#333b45]

              sm:text-[15px]
            "
          >
            {comment.content}
          </Text>

          {/*
           * دکمه‌های Edit/Delete
           * عمداً حفظ شده‌اند.
           */}

          <div
            className="
              mt-5
              flex
              items-center
              justify-end
              gap-2
              border-t
              border-black/5
              pt-3
            "
          >
            <button
              type="button"
              onClick={onEdit}
              className="
                inline-flex
                min-h-9
                items-center
                justify-center
                gap-1.5
                rounded-full
                px-3
                text-[12px]
                font-semibold
                text-[#ff6437]
                transition-colors

                hover:bg-[#fff4ef]
              "
            >
              <FiEdit2 />
              ویرایش
            </button>

            <button
              type="button"
              disabled={deletePending}
              onClick={onDelete}
              className="
                inline-flex
                min-h-9
                items-center
                justify-center
                gap-1.5
                rounded-full
                px-3
                text-[12px]
                font-semibold
                text-red-500
                transition-colors

                hover:bg-red-50

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <FiTrash2 />

              {deletePending ? "..." : "حذف"}
            </button>
          </div>
        </>
      )}
    </article>
  );
}

/* =====================================================
 * COMMENT TARGET
 * ===================================================== */

function getCommentTargetName(comment: MyCommentData) {
  if (comment.place) {
    return comment.place.placeName;
  }

  if (comment.event) {
    return comment.event.eventName;
  }

  return "فانیما";
}

/* =====================================================
 * EMPTY STATE
 * ===================================================== */

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
        rounded-[24px]
        bg-white
        px-5
        py-12
        text-center
      "
    >
      <div
        className="
          mx-auto
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[#fff4ef]
          text-[22px]
          text-[#ff6437]
        "
      >
        {icon}
      </div>

      <Text
        className="
          mt-4
          text-[16px]
          font-black
          text-[#111827]
        "
      >
        {title}
      </Text>

      <Text
        tone="secondary"
        className="
          mx-auto
          mt-2
          max-w-sm
          text-[13px]
          leading-7
        "
      >
        {description}
      </Text>
    </div>
  );
}

/* =====================================================
 * PAGINATION
 * ===================================================== */

function PaginationBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        mt-8
        rounded-[22px]
        bg-white
        p-3
      "
    >
      {children}
    </div>
  );
}

/* =====================================================
 * CARDS LOADING
 * ===================================================== */

function CardsLoading() {
  return (
    <div
      className="
        flex
        flex-col
        gap-9
      "
    >
      {[1, 2, 3].map((item) => (
        <div key={item}>
          <div
            className="
                aspect-[2.15/1]
                animate-pulse
                rounded-[24px]
                bg-gray-200
              "
          />

          <div
            className="
                mt-4
                h-5
                w-2/3
                animate-pulse
                rounded
                bg-gray-200
              "
          />

          <div
            className="
                mt-2
                h-4
                w-1/2
                animate-pulse
                rounded
                bg-gray-200
              "
          />
        </div>
      ))}
    </div>
  );
}

/* =====================================================
 * COMMENTS LOADING
 * ===================================================== */

function CommentsLoading() {
  return (
    <div
      className="
        flex
        flex-col
        gap-4
      "
    >
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="
              rounded-[24px]
              bg-white
              px-5
              py-6
            "
        >
          <div
            className="
                h-5
                w-2/3
                animate-pulse
                rounded
                bg-gray-200
              "
          />

          <div
            className="
                mt-5
                space-y-2
              "
          >
            <div
              className="
                  h-4
                  w-full
                  animate-pulse
                  rounded
                  bg-gray-200
                "
            />

            <div
              className="
                  h-4
                  w-full
                  animate-pulse
                  rounded
                  bg-gray-200
                "
            />

            <div
              className="
                  h-4
                  w-3/4
                  animate-pulse
                  rounded
                  bg-gray-200
                "
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
 * PROFILE LOADING
 * ===================================================== */

function ProfileLoading() {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        pt-2
      "
    >
      <div
        className="
          h-[92px]
          w-[92px]
          animate-pulse
          rounded-full
          bg-gray-200
        "
      />

      <div
        className="
          mt-5
          h-8
          w-36
          animate-pulse
          rounded
          bg-gray-200
        "
      />

      <div
        className="
          mt-3
          h-4
          w-28
          animate-pulse
          rounded
          bg-gray-200
        "
      />

      <div
        className="
          mt-8
          grid
          w-full
          grid-cols-3
          gap-4
        "
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="
                h-12
                animate-pulse
                rounded
                bg-gray-200
              "
          />
        ))}
      </div>

      <div
        className="
          mt-8
          w-full
        "
      >
        <CardsLoading />
      </div>
    </div>
  );
}
