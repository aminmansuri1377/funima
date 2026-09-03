"use client";

import { useState } from "react";

import { FiEye, FiFileText, FiSave } from "react-icons/fi";

import {
  Button,
  FormField,
  InlineMessage,
  Input,
  Text,
  Textarea,
} from "@/components/ui";

import { BlogCoverUploader } from "@/components/blog/blog-cover-uploader";

import { BlogEditor } from "@/components/blog/blog-editor";

type BlogFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
};

type Props = {
  initialValues?: Partial<BlogFormValues>;

  loading?: boolean;

  onSaveDraft: (values: BlogFormValues) => Promise<void>;

  onPublish: (values: BlogFormValues) => Promise<void>;
};

export function BlogForm({
  initialValues,
  loading = false,
  onSaveDraft,
  onPublish,
}: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? "");

  const [slug, setSlug] = useState(initialValues?.slug ?? "");

  const [excerpt, setExcerpt] = useState(initialValues?.excerpt ?? "");

  const [content, setContent] = useState(initialValues?.content ?? "");

  const [coverImage, setCoverImage] = useState(initialValues?.coverImage ?? "");

  const [error, setError] = useState<string | null>(null);

  function values(): BlogFormValues {
    return {
      title: title.trim(),

      slug: slug.trim(),

      excerpt: excerpt.trim(),

      content,

      coverImage: coverImage.trim(),
    };
  }

  function validate() {
    if (title.trim().length < 2) {
      setError("عنوان مقاله الزامی است.");

      return false;
    }

    if (slug.trim().length < 2) {
      setError("Slug الزامی است.");

      return false;
    }

    return true;
  }

  async function saveDraft() {
    setError(null);

    if (!validate()) {
      return;
    }

    try {
      await onSaveDraft(values());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ذخیره پیش‌نویس انجام نشد.",
      );
    }
  }

  async function publish() {
    setError(null);

    if (!validate()) {
      return;
    }

    try {
      await onPublish(values());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "انتشار مقاله انجام نشد.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <section
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
            grid gap-5
            md:grid-cols-2
          "
        >
          <FormField label="عنوان مقاله" required>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="عنوان مقاله"
              disabled={loading}
            />
          </FormField>

          <FormField label="Slug" required>
            <Input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              dir="ltr"
              className="text-left"
              placeholder="best-cafes-in-tehran"
              disabled={loading}
            />
          </FormField>
        </div>

        <FormField label="خلاصه مقاله" className="mt-5">
          <Textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="یک توضیح کوتاه برای کارت مقاله و SEO..."
            resize={false}
            disabled={loading}
          />
        </FormField>
      </section>

      <section
        className="
          rounded-xl
          border
          border-(--color-border)
          bg-(--color-surface)
          p-5
        "
      >
        <BlogCoverUploader
          value={coverImage}
          onChange={setCoverImage}
          disabled={loading}
        />
      </section>

      <section className="space-y-3">
        <div>
          <Text variant="heading-md">محتوای مقاله</Text>

          <Text variant="body-sm" tone="secondary" className="mt-1">
            متن، جدول، تصویر، لینک، لیست و سایر اجزای مقاله را اینجا اضافه کنید.
          </Text>
        </div>

        <BlogEditor value={content} onChange={setContent} disabled={loading} />
      </section>

      {error && <InlineMessage variant="error">{error}</InlineMessage>}

      <section
        className="
          sticky bottom-4
          z-20
          flex flex-col
          gap-3
          rounded-xl
          border
          border-(--color-border)
          bg-white/95
          p-4
          shadow-(--shadow-md)
          backdrop-blur
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <Text variant="label-md">وضعیت مقاله</Text>

          <Text variant="caption" tone="secondary">
            می‌توانید پیش‌نویس ذخیره کنید یا مستقیماً منتشر کنید.
          </Text>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            startIcon={<FiSave />}
            loading={loading}
            onClick={saveDraft}
          >
            ذخیره پیش‌نویس
          </Button>

          <Button
            type="button"
            startIcon={<FiEye />}
            loading={loading}
            onClick={publish}
          >
            انتشار مقاله
          </Button>
        </div>
      </section>
    </div>
  );
}
