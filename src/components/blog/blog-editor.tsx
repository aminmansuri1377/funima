"use client";

import { useRef, useState } from "react";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import ImageExtension from "@tiptap/extension-image";

import { TableKit } from "@tiptap/extension-table";

import TextAlign from "@tiptap/extension-text-align";

import Highlight from "@tiptap/extension-highlight";

import Placeholder from "@tiptap/extension-placeholder";

import TaskList from "@tiptap/extension-task-list";

import TaskItem from "@tiptap/extension-task-item";

import {
  FiAlignCenter,
  FiAlignLeft,
  FiAlignRight,
  FiBold,
  FiCheckSquare,
  FiCode,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiGrid,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  FiMinus,
  FiTrash2,
  FiUnderline,
} from "react-icons/fi";

import { InlineMessage } from "@/components/ui";

import { cn } from "@/lib/cn";

type BlogEditorProps = {
  value: string;

  onChange: (value: string) => void;

  disabled?: boolean;
};

export function BlogEditor({
  value,
  onChange,
  disabled = false,
}: BlogEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);

  let initialContent: object | string = "";

  if (value) {
    try {
      initialContent = JSON.parse(value);
    } catch {
      /*
       * برای سازگاری با مقاله‌های HTML قدیمی
       */
      initialContent = value;
    }
  }

  const editor = useEditor({
    immediatelyRender: false,

    editable: !disabled,

    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },

        link: {
          openOnClick: false,

          autolink: true,

          defaultProtocol: "https",
        },
      }),

      ImageExtension.configure({
        allowBase64: false,

        HTMLAttributes: {
          class: "blog-editor-image",
        },
      }),

      TableKit.configure({
        table: {
          resizable: true,

          HTMLAttributes: {
            class: "blog-editor-table",
          },
        },
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],

        alignments: ["left", "center", "right", "justify"],
      }),

      Highlight.configure({
        multicolor: false,
      }),

      Placeholder.configure({
        placeholder: "محتوای مقاله را بنویسید...",
      }),

      TaskList,

      TaskItem.configure({
        nested: true,
      }),
    ],

    content: initialContent,

    onUpdate({ editor }) {
      onChange(JSON.stringify(editor.getJSON()));
    },

    editorProps: {
      attributes: {
        class: "blog-prosemirror min-h-[500px] focus:outline-none",
        dir: "rtl",
      },
    },
  });

  if (!editor) {
    return null;
  }

  async function uploadImage(file: File) {
    const currentEditor = editor;

    if (!currentEditor) {
      setUploadError("ویرایشگر هنوز آماده نیست.");

      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      formData.append("kind", "content");

      const response = await fetch("/api/uploads/blog", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let result: {
        success?: boolean;
        url?: string;
        path?: string;
        error?: string;
      };

      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("[BlogEditor upload] Non-JSON response:", {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        });

        throw new Error(`خطای سرور هنگام آپلود تصویر (${response.status}).`);
      }

      if (!response.ok) {
        switch (result.error) {
          case "FILE_TOO_LARGE":
            throw new Error("حجم تصویر باید کمتر از ۸ مگابایت باشد.");

          case "INVALID_FILE_TYPE":
            throw new Error("فرمت تصویر معتبر نیست.");

          default:
            throw new Error("آپلود تصویر انجام نشد.");
        }
      }

      if (!result.url || typeof result.url !== "string") {
        throw new Error("آدرس تصویر از سرور دریافت نشد.");
      }

      currentEditor
        .chain()
        .focus()
        .setImage({
          src: result.url,

          alt: file.name,
        })
        .run();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "آپلود تصویر انجام نشد.",
      );
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  return (
    <div
      className="
        overflow-hidden
        rounded-xl
        border
        border-(--color-border)
        bg-(--color-surface)
      "
    >
      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadImage(file);
          }
        }}
      />

      <BlogToolbar
        editor={editor}
        uploading={uploading}
        onImage={() => fileRef.current?.click()}
      />

      {uploadError && (
        <div className="p-4">
          <InlineMessage variant="error">{uploadError}</InlineMessage>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

type BlogToolbarProps = {
  editor: Editor;

  uploading: boolean;

  onImage: () => void;
};

function BlogToolbar({ editor, uploading, onImage }: BlogToolbarProps) {
  function setLink() {
    const previousUrl = editor.getAttributes("link").href as string | undefined;

    const url = window.prompt("آدرس لینک:", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: url.trim(),

        target: "_blank",

        rel: "noopener noreferrer",
      })
      .run();
  }

  return (
    <div
      className="
        sticky top-0 z-10
        flex flex-wrap
        gap-1
        border-b
        border-(--color-border)
        bg-white
        p-2
      "
    >
      <ToolbarButton
        active={editor.isActive("bold")}
        title="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <FiBold />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("italic")}
        title="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <FiItalic />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("underline")}
        title="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <FiUnderline />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("strike")}
        title="خط‌خورده"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        S
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("highlight")}
        title="Highlight"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        H
      </ToolbarButton>

      <ToolbarDivider />

      {[1, 2, 3].map((level) => (
        <ToolbarButton
          key={level}
          active={editor.isActive("heading", {
            level,
          })}
          title={`Heading ${level}`}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: level as 1 | 2 | 3,
              })
              .run()
          }
        >
          H{level}
        </ToolbarButton>
      ))}

      <ToolbarDivider />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        title="لیست"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <FiList />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("orderedList")}
        title="لیست شماره‌دار"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("taskList")}
        title="چک‌لیست"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <FiCheckSquare />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        active={editor.isActive("blockquote")}
        title="نقل قول"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        “
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("codeBlock")}
        title="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <FiCode />
      </ToolbarButton>

      <ToolbarButton
        title="خط جداکننده"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <FiMinus />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        active={editor.isActive({
          textAlign: "right",
        })}
        title="راست‌چین"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <FiAlignRight />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive({
          textAlign: "center",
        })}
        title="وسط‌چین"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <FiAlignCenter />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive({
          textAlign: "left",
        })}
        title="چپ‌چین"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <FiAlignLeft />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        active={editor.isActive("link")}
        title="لینک"
        onClick={setLink}
      >
        <FiLink />
      </ToolbarButton>

      <ToolbarButton disabled={uploading} title="آپلود تصویر" onClick={onImage}>
        <FiImage />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="درج جدول"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({
              rows: 3,
              cols: 3,
              withHeaderRow: true,
            })
            .run()
        }
      >
        <FiGrid />
      </ToolbarButton>

      {editor.isActive("table") && (
        <>
          <ToolbarButton
            title="اضافه کردن ردیف بالا"
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            +R↑
          </ToolbarButton>

          <ToolbarButton
            title="اضافه کردن ردیف پایین"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            +R↓
          </ToolbarButton>

          <ToolbarButton
            title="حذف ردیف"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            -R
          </ToolbarButton>

          <ToolbarButton
            title="ستون قبل"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            +C←
          </ToolbarButton>

          <ToolbarButton
            title="ستون بعد"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            +C→
          </ToolbarButton>

          <ToolbarButton
            title="حذف ستون"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            -C
          </ToolbarButton>

          <ToolbarButton
            title="ادغام سلول‌ها"
            onClick={() => editor.chain().focus().mergeCells().run()}
          >
            Merge
          </ToolbarButton>

          <ToolbarButton
            title="تقسیم سلول"
            onClick={() => editor.chain().focus().splitCell().run()}
          >
            Split
          </ToolbarButton>

          <ToolbarButton
            title="ردیف Header"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          >
            HR
          </ToolbarButton>

          <ToolbarButton
            title="حذف جدول"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <FiTrash2 />
          </ToolbarButton>
        </>
      )}

      <ToolbarDivider />

      <ToolbarButton
        title="Undo"
        disabled={!editor.can().chain().focus().undo().run()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <FiCornerUpRight />
      </ToolbarButton>

      <ToolbarButton
        title="Redo"
        disabled={!editor.can().chain().focus().redo().run()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <FiCornerUpLeft />
      </ToolbarButton>
    </div>
  );
}

function ToolbarDivider() {
  return (
    <div
      className="
        mx-1
        h-8
        w-px
        bg-(--color-border)
      "
    />
  );
}

function ToolbarButton({
  children,
  active = false,
  disabled = false,
  title,
  onClick,
}: {
  children: React.ReactNode;

  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-9 min-w-9",
        "items-center justify-center",
        "rounded-lg px-2",
        "text-sm font-semibold",
        "transition-colors",

        active ? "bg-(--color-brand-500) text-white" : "hover:bg-gray-100",

        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}
