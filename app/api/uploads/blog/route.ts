import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { blogStorageBucket, supabaseAdmin } from "@/server/supabase/storage";
export const runtime = "nodejs";
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function getExtension(type: string) {
  switch (type) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/avif":
      return "avif";

    default:
      return null;
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.activeRole !== "ADMIN") {
    return NextResponse.json(
      {
        error: "FORBIDDEN",
      },
      {
        status: 403,
      },
    );
  }

  const formData = await request.formData();

  const file = formData.get("file");

  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        error: "FILE_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: "INVALID_FILE_TYPE",
      },
      {
        status: 400,
      },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: "FILE_TOO_LARGE",
      },
      {
        status: 400,
      },
    );
  }

  const extension = getExtension(file.type);

  if (!extension) {
    return NextResponse.json(
      {
        error: "INVALID_EXTENSION",
      },
      {
        status: 400,
      },
    );
  }

  const folder = kind === "cover" ? "covers" : "content";

  const storagePath = `${folder}/${session.user.id}/${randomUUID()}.${extension}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  const upload = await supabaseAdmin.storage
    .from(blogStorageBucket)
    .upload(storagePath, bytes, {
      contentType: file.type,

      cacheControl: "31536000",

      upsert: false,
    });

  if (upload.error) {
    console.error("[Blog upload]", upload.error);

    return NextResponse.json(
      {
        error: "UPLOAD_FAILED",
      },
      {
        status: 500,
      },
    );
  }

  const { data } = supabaseAdmin.storage
    .from(blogStorageBucket)
    .getPublicUrl(storagePath);

  return NextResponse.json({
    success: true,

    url: data.publicUrl,

    path: storagePath,
  });
}
