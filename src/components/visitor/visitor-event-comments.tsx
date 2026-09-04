"use client";

import { useState } from "react";

import { InlineMessage, Pagination } from "@/components/ui";

import { trpc } from "@/trpc/client";

import { VisitorComments } from "./visitor-comments";

type Props = {
  eventId: string;

  onEventChanged?: () => void | Promise<unknown>;
};

export function VisitorEventComments({ eventId, onEventChanged }: Props) {
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

  const comments = trpc.visitor.comments.list.useQuery({
    eventId,

    page,

    pageSize,
  });

  async function handleChanged() {
    const result = await comments.refetch();

    /*
     * اگر آخرین comment صفحه حذف شد
     * و صفحه فعلی خالی شد، یک صفحه عقب.
     */
    if (page > 1 && result.data && result.data.items.length === 0) {
      setPage((current) => Math.max(current - 1, 1));
    }

    await onEventChanged?.();
  }

  if (comments.isPending) {
    return <CommentsLoading />;
  }

  if (comments.error || !comments.data) {
    return (
      <InlineMessage variant="error">
        دریافت نظرات ایونت انجام نشد.
      </InlineMessage>
    );
  }

  return (
    <div className="space-y-4">
      <VisitorComments
        target={{
          type: "event",

          eventId,
        }}
        comments={comments.data.items}
        totalCount={comments.data.pagination.total}
        onChanged={handleChanged}
      />

      {comments.data.pagination.totalPages > 1 && (
        <div
          className="
            rounded-3xl
            bg-white
            p-4
            shadow-sm
          "
        >
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
        </div>
      )}
    </div>
  );
}

function CommentsLoading() {
  return (
    <div
      className="
        rounded-[30px]
        bg-white
        p-5
        sm:p-7
      "
    >
      <div
        className="
          h-7
          w-28
          animate-pulse
          rounded
          bg-gray-100
        "
      />

      <div
        className="
          mt-5
          h-32
          animate-pulse
          rounded-[22px]
          bg-gray-100
        "
      />

      <div
        className="
          mt-5
          space-y-4
        "
      >
        {[1, 2].map((item) => (
          <div
            key={item}
            className="
                h-24
                animate-pulse
                rounded-[20px]
                bg-gray-100
              "
          />
        ))}
      </div>
    </div>
  );
}
