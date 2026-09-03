"use client";

import Image from "next/image";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  FiEdit2,
  FiFileText,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";

import { Button, InlineMessage, Input, Text } from "@/components/ui";

import { trpc } from "@/trpc/client";

export function BlogsManager() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const [error, setError] = useState<string | null>(null);

  const blogs = trpc.panel.blogs.list.useQuery({
    search: search.trim() || undefined,
  });

  const deleteBlog = trpc.panel.blogs.delete.useMutation();

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
            مدیریت مقالات فونیما
          </Text>
        </div>

        <Button
          startIcon={<FiPlus />}
          onClick={() => router.push("/panel/blogs/new")}
        >
          مقاله جدید
        </Button>
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
              absolute right-5 top-1/2
              -translate-y-1/2
              text-(--color-text-secondary)
            "
          />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجوی عنوان یا slug..."
            className="pr-12"
          />
        </div>
      </div>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      {blogs.data?.length === 0 && (
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

          <Text variant="heading-md">هنوز مقاله‌ای وجود ندارد</Text>
        </div>
      )}

      {blogs.data && blogs.data.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {blogs.data.map((blog) => (
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
              {blog.coverImage && (
                <div className="relative aspect-16/7">
                  <Image
                    src={blog.coverImage}
                    alt={blog.title}
                    fill
                    sizes="(max-width:1280px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Text variant="heading-md">{blog.title}</Text>

                    <Text variant="caption" tone="secondary" className="mt-1">
                      /{blog.slug}
                    </Text>
                  </div>

                  <span
                    className={
                      blog.isPublished
                        ? "rounded-full bg-green-50 px-3 py-1 text-xs text-green-700"
                        : "rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                    }
                  >
                    {blog.isPublished ? "منتشر شده" : "پیش‌نویس"}
                  </span>
                </div>

                {blog.excerpt && (
                  <Text tone="secondary" className="mt-4">
                    {blog.excerpt}
                  </Text>
                )}

                <div className="mt-5 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    startIcon={<FiEdit2 />}
                    onClick={() => router.push(`/panel/blogs/${blog.id}`)}
                  >
                    ویرایش
                  </Button>

                  <Button
                    size="sm"
                    variant="tertiary"
                    startIcon={<FiTrash2 />}
                    onClick={() => handleDelete(blog.id, blog.title)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
