"use client";

import Image from "next/image";

import { useState } from "react";

import { FiMessageSquare, FiSearch, FiTrash2 } from "react-icons/fi";

import { Button, InlineMessage, Input, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function CommentsManager() {
  const [search, setSearch] = useState("");

  const [error, setError] = useState<string | null>(null);

  const comments = trpc.panel.comments.list.useQuery({
    search: search.trim() || undefined,
  });

  const deleteComment = trpc.panel.comments.delete.useMutation();

  async function handleDelete(commentId: string) {
    const confirmed = window.confirm("آیا از حذف این کامنت مطمئن هستید؟");

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteComment.mutateAsync({
        commentId,
      });

      await comments.refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف کامنت انجام نشد.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="heading-xl">
          کامنت‌ها
        </Text>

        <Text tone="secondary" className="mt-1">
          مدیریت نظرات کاربران فونیما
        </Text>
      </div>

      <div
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-4
        "
      >
        <div className="relative">
          <FiSearch
            className="
              absolute
              right-5
              top-1/2
              -translate-y-1/2
              text-(--color-text-secondary)
            "
          />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو در متن، کاربر، مکان یا رویداد..."
            className="pr-12"
          />
        </div>
      </div>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {comments.isPending && (
        <Text tone="secondary">در حال دریافت کامنت‌ها...</Text>
      )}

      {comments.error && (
        <InlineMessage variant="error">
          دریافت کامنت‌ها با خطا مواجه شد.
        </InlineMessage>
      )}

      {comments.data && comments.data.length > 0 && (
        <div className="space-y-4">
          {comments.data.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              deleting={deleteComment.isPending}
              onDelete={() => handleDelete(comment.id)}
            />
          ))}
        </div>
      )}

      {comments.data?.length === 0 && (
        <div
          className="
            rounded-xl
            border
            border-dashed
            border-(--color-border)
            bg-(--color-surface)
            p-12
            text-center
          "
        >
          <FiMessageSquare size={32} className="mx-auto mb-3" />

          <Text variant="heading-md">کامنتی پیدا نشد</Text>

          <Text tone="secondary" className="mt-2">
            هنوز نظری ثبت نشده یا نتیجه‌ای برای جستجو وجود ندارد.
          </Text>
        </div>
      )}
    </div>
  );
}

type CommentCardProps = {
  comment: {
    id: string;
    content: string;
    createdAt: Date | string;

    user: {
      id: string;
      fullName: string;
      phoneNumber: string;
      profileImage: string | null;
      roles: string[];
    };

    place: {
      id: string;
      placeName: string;
    } | null;

    event: {
      id: string;
      eventName: string;
    } | null;
  };

  deleting: boolean;

  onDelete: () => void;
};

function CommentCard({ comment, deleting, onDelete }: CommentCardProps) {
  return (
    <article
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
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div className="flex min-w-0 gap-3">
          <UserAvatar
            image={comment.user.profileImage}
            name={comment.user.fullName}
          />

          <div className="min-w-0">
            <Text variant="label-lg">{comment.user.fullName}</Text>

            <Text variant="caption" tone="secondary" className="mt-1">
              <span dir="ltr" className="inline-block">
                {comment.user.phoneNumber}
              </span>

              {" • "}

              {formatDate(comment.createdAt)}
            </Text>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="tertiary"
          startIcon={<FiTrash2 />}
          disabled={deleting}
          onClick={onDelete}
        >
          حذف
        </Button>
      </div>

      <div
        className="
          mt-5
          rounded-lg
          bg-gray-50
          p-4
        "
      >
        <Text variant="body-md" className="whitespace-pre-wrap">
          {comment.content}
        </Text>
      </div>

      <div
        className="
          mt-4
          flex
          flex-wrap
          gap-2
          text-sm
        "
      >
        {comment.place && (
          <span
            className="
              rounded-full
              bg-(--color-brand-50)
              px-3 py-1.5
              text-(--color-brand-700)
            "
          >
            مکان: {comment.place.placeName}
          </span>
        )}

        {comment.event && (
          <span
            className="
              rounded-full
              bg-gray-100
              px-3 py-1.5
            "
          >
            رویداد: {comment.event.eventName}
          </span>
        )}

        <span
          className="
            rounded-full
            bg-gray-100
            px-3 py-1.5
          "
        >
          نقش‌ها: {comment.user.roles.join("، ")}
        </span>
      </div>
    </article>
  );
}

function UserAvatar({
  image,
  name,
}: {
  image: string | null;

  name: string;
}) {
  if (image) {
    return (
      <div
        className="
          relative
          h-11
          w-11
          shrink-0
          overflow-hidden
          rounded-full
        "
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="44px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-(--color-brand-50)
        font-bold
        text-(--color-brand-600)
      "
    >
      {name.trim().charAt(0) || "؟"}
    </div>
  );
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
