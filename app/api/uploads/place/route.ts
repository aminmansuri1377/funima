import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/server/db/prisma";

import { storageBucket, supabaseAdmin } from "@/server/supabase/storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function getExtension(file: File) {
  switch (file.type) {
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

  if (!session?.user?.id || !session.user.activeRole) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
      },
      {
        status: 401,
      },
    );
  }

  const formData = await request.formData();

  const file = formData.get("file");

  const placeId = formData.get("placeId");

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

  if (typeof placeId !== "string" || !placeId) {
    return NextResponse.json(
      {
        error: "PLACE_ID_REQUIRED",
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

  const place = await prisma.place.findUnique({
    where: {
      id: placeId,
    },

    include: {
      host: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!place) {
    return NextResponse.json(
      {
        error: "PLACE_NOT_FOUND",
      },
      {
        status: 404,
      },
    );
  }

  const isAdmin = session.user.activeRole === "ADMIN";

  const isOwnerHost =
    session.user.activeRole === "HOST" && place.host.userId === session.user.id;

  if (!isAdmin && !isOwnerHost) {
    return NextResponse.json(
      {
        error: "FORBIDDEN",
      },
      {
        status: 403,
      },
    );
  }

  const extension = getExtension(file);

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

  const storagePath = `places/${place.id}/${randomUUID()}.${extension}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  const upload = await supabaseAdmin.storage
    .from(storageBucket)
    .upload(storagePath, bytes, {
      contentType: file.type,

      cacheControl: "31536000",

      upsert: false,
    });

  if (upload.error) {
    console.error("[Place Upload]", upload.error);

    return NextResponse.json(
      {
        error: "UPLOAD_FAILED",
      },
      {
        status: 500,
      },
    );
  }

  const { data: publicData } = supabaseAdmin.storage
    .from(storageBucket)
    .getPublicUrl(storagePath);

  const lastImage = await prisma.placeImage.findFirst({
    where: {
      placeId: place.id,
    },

    orderBy: {
      sortOrder: "desc",
    },

    select: {
      sortOrder: true,
    },
  });

  let image;

  try {
    image = await prisma.placeImage.create({
      data: {
        placeId: place.id,

        url: publicData.publicUrl,

        sortOrder: (lastImage?.sortOrder ?? -1) + 1,
      },
    });
  } catch (error) {
    /*
     * اگر ساخت رکورد DB شکست خورد،
     * فایل orphan داخل Storage نماند.
     */
    await supabaseAdmin.storage.from(storageBucket).remove([storagePath]);

    throw error;
  }

  /*
   * AuditLog فقط برای Admin.
   * Host upload نباید به عنوان
   * Admin activity ذخیره شود.
   */
  if (isAdmin) {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: session.user.id,

          action: "UPLOAD_PLACE_IMAGE",

          entity: "PlaceImage",

          entityId: image.id,

          metadata: {
            placeId: place.id,

            storagePath,

            size: file.size,

            mimeType: file.type,
          },
        },
      });
    } catch (error) {
      console.error("[Place Upload Audit]", error);
    }
  }

  return NextResponse.json({
    success: true,

    image: {
      id: image.id,

      url: image.url,

      sortOrder: image.sortOrder,
    },
  });
}
