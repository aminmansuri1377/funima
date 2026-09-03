"use client";

import { useRouter } from "next/navigation";

import { Button, InlineMessage, Text } from "@/components/ui";

import { BlogForm } from "./blog-form";

import { trpc } from "@/trpc/client";

type Props = {
  blogId: string;
};

export function EditBlogManager({ blogId }: Props) {
  const router = useRouter();

  const blog = trpc.panel.blogs.getById.useQuery({
    blogId,
  });

  if (blog.isPending) {
    return <Text tone="secondary">در حال دریافت مقاله...</Text>;
  }

  if (blog.error || !blog.data) {
    return (
      <InlineMessage variant="error">دریافت مقاله انجام نشد.</InlineMessage>
    );
  }

  return (
    <EditBlogContent
      key={blog.data.id}
      blog={blog.data}
      onUpdated={() => blog.refetch()}
      onBack={() => router.push("/panel/blogs")}
    />
  );
}

type EditBlogContentProps = {
  blog: {
    id: string;
    title: string;
    slug: string;

    excerpt: string | null;

    content: string;

    coverImage: string | null;

    isPublished: boolean;
  };

  onUpdated: () => void | Promise<unknown>;

  onBack: () => void;
};

function EditBlogContent({ blog, onUpdated, onBack }: EditBlogContentProps) {
  const update = trpc.panel.blogs.update.useMutation();

  return (
    <div className="space-y-6">
      <div
        className="
          flex flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <Text as="h1" variant="heading-xl">
            ویرایش مقاله
          </Text>

          <Text tone="secondary" className="mt-1">
            {blog.title}
          </Text>
        </div>

        <Button variant="secondary" onClick={onBack}>
          بازگشت
        </Button>
      </div>

      <BlogForm
        initialValues={{
          title: blog.title,

          slug: blog.slug,

          excerpt: blog.excerpt ?? "",

          content: blog.content,

          coverImage: blog.coverImage ?? "",
        }}
        loading={update.isPending}
        onSaveDraft={async (values) => {
          await update.mutateAsync({
            blogId: blog.id,

            ...values,

            isPublished: false,
          });

          await onUpdated();
        }}
        onPublish={async (values) => {
          await update.mutateAsync({
            blogId: blog.id,

            ...values,

            isPublished: true,
          });

          await onUpdated();
        }}
      />
    </div>
  );
}
