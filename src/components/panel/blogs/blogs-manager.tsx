"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FiEdit2, FiFileText, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  Button,
  InlineMessage,
  Pagination,
  SearchInput,
  Text,
} from "@/components/ui";

import { trpc } from "@/trpc/client";

export function BlogsManager() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(20);

  const [error, setError] = useState<string | null>(null);

  const blogs = trpc.panel.blogs.list.useQuery({
    page,
    pageSize,

    search: debouncedSearch.trim() || undefined,
  });

  const deleteBlog = trpc.panel.blogs.delete.useMutation();

  function clearSearch() {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }

  async function handleDelete(blogId: string, title: string) {
    const confirmed = window.confirm(`مقاله «${title}» حذف شود؟`);

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteBlog.mutateAsync({
        blogId,
      });

      await blogs.refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : "حذف مقاله انجام نشد.");
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="
          flex flex-col gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            بلاگ‌ها
          </Text>

          <Text tone="secondary" className="mt-1">
            مدیریت مقالات فانیما
          </Text>
        </div>

        <Button
          startIcon={<FiPlus />}
          onClick={() => router.push("/panel/blogs/new")}
        >
          مقاله جدید
        </Button>
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
          placeholder="جستجوی عنوان، slug، نویسنده یا خلاصه..."
        />
      </section>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {blogs.isPending && <Text tone="secondary">در حال دریافت مقالات...</Text>}

      {blogs.error && (
        <InlineMessage variant="error">
          دریافت مقالات با خطا مواجه شد.
        </InlineMessage>
      )}

      {blogs.data && (
        <>
          <BlogsGrid
            blogs={blogs.data.items}
            deleting={deleteBlog.isPending}
            onEdit={(blogId) => router.push(`/panel/blogs/${blogId}`)}
            onDelete={handleDelete}
          />

          {blogs.data.pagination.total > 0 && (
            <Pagination
              page={blogs.data.pagination.page}
              pageSize={blogs.data.pagination.pageSize}
              totalItems={blogs.data.pagination.total}
              totalPages={blogs.data.pagination.totalPages}
              disabled={blogs.isFetching}
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

type BlogListItem = {
  id: string;
  title: string;
  slug: string;

  excerpt: string | null;

  coverImage: string | null;

  isPublished: boolean;

  publishedAt: Date | string | null;

  createdAt: Date | string;

  author: {
    id: string;
    fullName: string;

    profileImage: string | null;
  };
};

type BlogsGridProps = {
  blogs: BlogListItem[];

  deleting: boolean;

  onEdit: (blogId: string) => void;

  onDelete: (blogId: string, title: string) => void;
};

function BlogsGrid({ blogs, deleting, onEdit, onDelete }: BlogsGridProps) {
  if (blogs.length === 0) {
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
        <FiFileText size={32} className="mx-auto mb-3" />

        <Text variant="heading-md">مقاله‌ای پیدا نشد</Text>

        <Text tone="secondary" className="mt-2">
          هنوز مقاله‌ای ساخته نشده یا نتیجه‌ای برای جستجو وجود ندارد.
        </Text>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {blogs.map((blog) => (
        <article
          key={blog.id}
          className="
              overflow-hidden
              rounded-xl
              border
              border-(--color-border)
              bg-(--color-surface)
            "
        >
          {blog.coverImage ? (
            <div className="relative aspect-16/7">
              <Image
                src={blog.coverImage}
                alt={blog.title}
                fill
                sizes="(max-width:1280px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="
                  flex aspect-16/7
                  items-center
                  justify-center
                  bg-gray-100
                "
            >
              <FiFileText size={36} />
            </div>
          )}

          <div className="p-5">
            <div
              className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
            >
              <div className="min-w-0">
                <Text variant="heading-md">{blog.title}</Text>

                <Text
                  variant="caption"
                  tone="secondary"
                  className="mt-1"
                  dir="ltr"
                >
                  /{blog.slug}
                </Text>
              </div>

              <span
                className={
                  blog.isPublished
                    ? "shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs text-green-700"
                    : "shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                }
              >
                {blog.isPublished ? "منتشر شده" : "پیش‌نویس"}
              </span>
            </div>

            {blog.excerpt && (
              <Text
                tone="secondary"
                className="
                    mt-4
                    line-clamp-3
                  "
              >
                {blog.excerpt}
              </Text>
            )}

            <div
              className="
                  mt-5
                  flex
                  items-center
                  justify-between
                  gap-3
                  border-t
                  border-(--color-border)
                  pt-4
                "
            >
              <div className="flex items-center gap-2">
                <AuthorAvatar
                  name={blog.author.fullName}
                  image={blog.author.profileImage}
                />

                <div>
                  <Text variant="caption">{blog.author.fullName}</Text>

                  <Text variant="caption" tone="secondary">
                    {formatDate(blog.publishedAt ?? blog.createdAt)}
                  </Text>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  startIcon={<FiEdit2 />}
                  onClick={() => onEdit(blog.id)}
                >
                  ویرایش
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="tertiary"
                  startIcon={<FiTrash2 />}
                  disabled={deleting}
                  onClick={() => onDelete(blog.id, blog.title)}
                >
                  حذف
                </Button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function AuthorAvatar({
  name,
  image,
}: {
  name: string;

  image: string | null;
}) {
  if (image) {
    return (
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
        <Image
          src={image}
          alt={name}
          fill
          sizes="36px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="
        flex h-9 w-9
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-(--color-brand-50)
        text-sm
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
  }).format(new Date(value));
}
