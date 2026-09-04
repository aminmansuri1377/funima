"use client";

import Image from "next/image";

import { useState } from "react";

import { FiMessageSquare, FiTrash2 } from "react-icons/fi";

import {
  Button,
  InlineMessage,
  Pagination,
  SearchInput,
  Text,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

export function CommentsManager() {
  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(20);

  const [error, setError] = useState<string | null>(null);

  const comments = trpc.panel.comments.list.useQuery({
    page,
    pageSize,

    search: debouncedSearch.trim() || undefined,
  });

  const deleteComment = trpc.panel.comments.delete.useMutation();

  function clearSearch() {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }

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

      <section
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-4
        "
      >
        <SearchInput
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);

            setPage(1);
          }}
          onDebouncedChange={(value) => {
            setDebouncedSearch(value);

            setPage(1);
          }}
          onClear={clearSearch}
          placeholder="جستجو در متن، کاربر، مکان یا رویداد..."
        />
      </section>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {comments.isPending && (
        <Text tone="secondary">در حال دریافت کامنت‌ها...</Text>
      )}

      {comments.error && (
        <InlineMessage variant="error">
          دریافت کامنت‌ها با خطا مواجه شد.
        </InlineMessage>
      )}

      {comments.data && (
        <>
          <CommentsList
            comments={comments.data.items}
            deleting={deleteComment.isPending}
            onDelete={handleDelete}
          />

          {comments.data.pagination.total > 0 && (
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
          )}
        </>
      )}
    </div>
  );
}

type CommentListItem = {
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

type CommentsListProps = {
  comments: CommentListItem[];

  deleting: boolean;

  onDelete: (commentId: string) => void;
};

function CommentsList({ comments, deleting, onDelete }: CommentsListProps) {
  if (comments.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          deleting={deleting}
          onDelete={() => onDelete(comment.id)}
        />
      ))}
    </div>
  );
}

function CommentCard({
  comment,
  deleting,
  onDelete,
}: {
  comment: CommentListItem;

  deleting: boolean;

  onDelete: () => void;
}) {
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
          flex flex-col gap-4
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
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
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
        flex h-11 w-11
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
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
