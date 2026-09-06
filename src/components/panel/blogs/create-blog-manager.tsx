"use client";

import { useRouter } from "next/navigation";

import { Text } from "@/components/ui";

import { BlogForm } from "./blog-form";

import { trpc } from "@/trpc/client";

export function CreateBlogManager() {
  const router = useRouter();

  const create = trpc.panel.blogs.create.useMutation();

  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="heading-xl">
          مقاله جدید
        </Text>

        <Text tone="secondary" className="mt-1">
          نوشتن و انتشار مقاله جدید در فانیما
        </Text>
      </div>

      <BlogForm
        loading={create.isPending}
        onSaveDraft={async (values) => {
          const result = await create.mutateAsync({
            ...values,

            isPublished: false,
          });

          router.push(`/panel/blogs/${result.blogId}`);
        }}
        onPublish={async (values) => {
          const result = await create.mutateAsync({
            ...values,

            isPublished: true,
          });

          router.push(`/panel/blogs/${result.blogId}`);
        }}
      />
    </div>
  );
}
