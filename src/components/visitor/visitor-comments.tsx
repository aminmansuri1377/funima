"use client";

import Image from "next/image";

import { useState } from "react";

import {
  FiEdit2,
  FiMessageCircle,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { Button, InlineMessage, Text, Textarea } from "@/components/ui";

import { trpc } from "@/trpc/client";

type VisitorComment = {
  id: string;

  content: string;

  createdAt: Date | string;

  updatedAt: Date | string;

  user: {
    id: string;

    fullName: string;

    profileImage: string | null;
  };
};

type CommentTarget =
  | {
      type: "place";

      placeId: string;
    }
  | {
      type: "event";

      eventId: string;
    };

type Props = {
  target: CommentTarget;

  comments: VisitorComment[];

  totalCount?: number;

  onChanged: () => void | Promise<unknown>;
};

export function VisitorComments({
  target,
  comments,
  totalCount,
  onChanged,
}: Props) {
  /*
   * اطلاعات کاربر فعلی
   *
   * برای اینکه بفهمیم کدام Comment
   * متعلق به خود کاربر است و دکمه‌های
   * Edit / Delete را فقط برای خودش نشان دهیم.
   */
  const profile = trpc.visitor.profile.me.useQuery();

  /*
   * ابزار دسترسی به Query Cache مربوط به tRPC
   *
   * با utils می‌توانیم queryهای دیگر پروژه را
   * invalidate کنیم.
   */
  const utils = trpc.useUtils();

  const create = trpc.visitor.comments.create.useMutation();

  const update = trpc.visitor.comments.update.useMutation();

  const remove = trpc.visitor.comments.delete.useMutation();

  const [content, setContent] = useState("");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const [editingContent, setEditingContent] = useState("");

  const [error, setError] = useState<string | null>(null);

  /*
   * ========================================
   * CREATE COMMENT
   * ========================================
   */
  async function handleCreate() {
    const value = content.trim();

    if (value.length < 2) {
      setError("متن نظر را وارد کنید.");

      return;
    }

    setError(null);

    try {
      /*
       * VisitorComments برای Place و Event
       * مشترک است.
       *
       * بر اساس target مشخص می‌کنیم
       * Comment متعلق به کدام entity باشد.
       */
      if (target.type === "place") {
        await create.mutateAsync({
          placeId: target.placeId,

          content: value,
        });
      } else {
        await create.mutateAsync({
          eventId: target.eventId,

          content: value,
        });
      }

      /*
       * input خالی شود.
       */
      setContent("");

      /*
       * parent را تازه می‌کنیم.
       *
       * مثلاً:
       *
       * Single Place
       * → place.refetch()
       *
       * یا Event Comments
       * → comments.refetch()
       */
      await onChanged();

      /*
       * چون یک Comment جدید ساخته شده،
       * تعداد Comments کاربر در Profile
       * یک عدد بیشتر شده است.
       *
       * بنابراین profile.me باید invalidate شود.
       */
      await utils.visitor.profile.me.invalidate();

      /*
       * اگر کاربر بعداً وارد:
       *
       * Profile → نظرات من
       *
       * شد، Comment جدید باید آنجا هم باشد.
       */
      await utils.visitor.comments.mine.invalidate();
    } catch (error) {
      setError(error instanceof Error ? error.message : "ثبت نظر انجام نشد.");
    }
  }

  /*
   * ========================================
   * START EDIT
   * ========================================
   */
  function startEditing(comment: VisitorComment) {
    setEditingCommentId(comment.id);

    setEditingContent(comment.content);

    setError(null);
  }

  /*
   * ========================================
   * CANCEL EDIT
   * ========================================
   */
  function cancelEditing() {
    setEditingCommentId(null);

    setEditingContent("");
  }

  /*
   * ========================================
   * UPDATE COMMENT
   * ========================================
   */
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

      /*
       * Comment صفحه فعلی تازه شود.
       */
      await onChanged();

      /*
       * چون متن Comment عوض شده،
       * Profile → نظرات من هم باید
       * متن جدید را بگیرد.
       *
       * profile.me لازم نیست invalidate شود
       * چون تعداد Comment تغییر نکرده.
       */
      await utils.visitor.comments.mine.invalidate();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ویرایش نظر انجام نشد.",
      );
    }
  }

  /*
   * ========================================
   * DELETE COMMENT
   * ========================================
   */
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

      /*
       * Comment از صفحه فعلی حذف شود.
       */
      await onChanged();

      /*
       * اینجا تعداد Comments کاربر
       * یک عدد کمتر شده.
       *
       * پس هم count پروفایل و هم
       * لیست Comments کاربر باید تازه شوند.
       */
      await Promise.all([
        utils.visitor.profile.me.invalidate(),

        utils.visitor.comments.mine.invalidate(),
      ]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف نظر انجام نشد.");
    }
  }

  const loading = create.isPending || update.isPending || remove.isPending;

  return (
    <section
      className="
        rounded-[30px]
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        sm:p-7
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              bg-(--color-brand-50)
              text-lg
              text-(--color-brand-600)
            "
          >
            <FiMessageCircle />
          </div>

          <div>
            <Text variant="heading-md">نظرات</Text>

            <Text variant="caption" tone="secondary" className="mt-0.5">
              {(totalCount ?? comments.length).toLocaleString("fa-IR")} نظر
            </Text>
          </div>
        </div>
      </div>

      {/*
       * ========================================
       * CREATE COMMENT FORM
       * ========================================
       */}
      <div
        className="
          mt-6
          rounded-[22px]
          bg-[#f8f8f8]
          p-4
        "
      >
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="نظرت رو بنویس..."
          resize={false}
          disabled={loading}
        />

        <div
          className="
            mt-3
            flex
            justify-end
          "
        >
          <Button
            type="button"
            size="sm"
            startIcon={<FiSend />}
            loading={create.isPending}
            disabled={content.trim().length < 2}
            onClick={handleCreate}
          >
            ثبت نظر
          </Button>
        </div>
      </div>

      {error && (
        <InlineMessage variant="error" className="mt-4">
          {error}
        </InlineMessage>
      )}

      {/*
       * ========================================
       * EMPTY STATE
       * ========================================
       */}
      {comments.length === 0 ? (
        <div
          className="
            py-10
            text-center
          "
        >
          <FiMessageCircle
            size={32}
            className="
              mx-auto
              text-(--color-text-secondary)
            "
          />

          <Text variant="label-lg" className="mt-3">
            هنوز نظری ثبت نشده
          </Text>

          <Text variant="caption" tone="secondary" className="mt-1">
            اولین نفری باش که نظر می‌ده.
          </Text>
        </div>
      ) : (
        <div
          className="
            mt-6
            divide-y
            divide-(--color-border)
          "
        >
          {/*
           * ========================================
           * COMMENTS LIST
           * ========================================
           */}
          {comments.map((comment) => {
            /*
             * فقط صاحب Comment
             * می‌تواند Edit/Delete کند.
             */
            const isMine = profile.data?.id === comment.user.id;

            const isEditing = editingCommentId === comment.id;

            return (
              <article
                key={comment.id}
                className="
                    py-5
                    first:pt-0
                    last:pb-0
                  "
              >
                <div
                  className="
                      flex
                      items-start
                      gap-3
                    "
                >
                  <CommentAvatar
                    name={comment.user.fullName}
                    image={comment.user.profileImage}
                  />

                  <div
                    className="
                        min-w-0
                        flex-1
                      "
                  >
                    <div
                      className="
                          flex
                          items-start
                          justify-between
                          gap-3
                        "
                    >
                      <div>
                        <Text variant="label-md">{comment.user.fullName}</Text>

                        <Text
                          variant="caption"
                          tone="secondary"
                          className="mt-0.5"
                        >
                          {formatDate(comment.createdAt)}
                        </Text>
                      </div>

                      {isMine && !isEditing && (
                        <div
                          className="
                                flex
                                gap-1
                              "
                        >
                          <CommentAction
                            label="ویرایش نظر"
                            onClick={() => startEditing(comment)}
                          >
                            <FiEdit2 />
                          </CommentAction>

                          <CommentAction
                            label="حذف نظر"
                            danger
                            disabled={remove.isPending}
                            onClick={() => handleDelete(comment.id)}
                          >
                            <FiTrash2 />
                          </CommentAction>
                        </div>
                      )}
                    </div>

                    {/*
                     * ========================================
                     * EDIT MODE
                     * ========================================
                     */}
                    {isEditing ? (
                      <div className="mt-3">
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
                              mt-2
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
                            disabled={update.isPending}
                            onClick={cancelEditing}
                          >
                            انصراف
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /*
                       * ========================================
                       * NORMAL COMMENT
                       * ========================================
                       */
                      <Text
                        tone="secondary"
                        className="
                            mt-3
                            whitespace-pre-wrap
                            leading-7
                          "
                      >
                        {comment.content}
                      </Text>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CommentAvatar({
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
      aria-hidden="true"
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

function CommentAction({
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

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",

    month: "long",

    day: "numeric",
  }).format(new Date(value));
}
