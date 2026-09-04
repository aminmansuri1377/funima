import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/server/db/prisma";

import { eventStorageBucket, supabaseAdmin } from "@/server/supabase/storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MAX_EVENT_IMAGES = 8;

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

  const eventId = formData.get("eventId");

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

  if (typeof eventId !== "string" || !eventId.trim()) {
    return NextResponse.json(
      {
        error: "EVENT_ID_REQUIRED",
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

  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },

    select: {
      id: true,

      place: {
        select: {
          host: {
            select: {
              userId: true,
            },
          },
        },
      },

      _count: {
        select: {
          images: true,
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json(
      {
        error: "EVENT_NOT_FOUND",
      },
      {
        status: 404,
      },
    );
  }

  const isAdmin = session.user.activeRole === "ADMIN";

  const isOwnerHost =
    session.user.activeRole === "HOST" &&
    event.place.host.userId === session.user.id;

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

  if (event._count.images >= MAX_EVENT_IMAGES) {
    return NextResponse.json(
      {
        error: "MAX_IMAGES_REACHED",
      },
      {
        status: 400,
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

  /*
   * چون bucket خودش events است:
   *
   * events bucket
   *   └── {eventId}
   *         └── uuid.webp
   */
  const storagePath = `${event.id}/${randomUUID()}.${extension}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  const upload = await supabaseAdmin.storage
    .from(eventStorageBucket)
    .upload(storagePath, bytes, {
      contentType: file.type,

      cacheControl: "31536000",

      upsert: false,
    });

  if (upload.error) {
    console.error("[Event Image Upload]", upload.error);

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
    .from(eventStorageBucket)
    .getPublicUrl(storagePath);

  const lastImage = await prisma.eventImage.findFirst({
    where: {
      eventId: event.id,
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
    image = await prisma.eventImage.create({
      data: {
        eventId: event.id,

        url: publicData.publicUrl,

        storagePath,

        sortOrder: (lastImage?.sortOrder ?? -1) + 1,
      },
    });
  } catch (error) {
    /*
     * فایل orphan در Storage باقی نماند.
     */
    await supabaseAdmin.storage.from(eventStorageBucket).remove([storagePath]);

    throw error;
  }

  /*
   * AuditLog فقط برای Admin.
   */
  if (isAdmin) {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: session.user.id,

          action: "UPLOAD_EVENT_IMAGE",

          entity: "EventImage",

          entityId: image.id,

          metadata: {
            eventId: event.id,

            storagePath,

            size: file.size,

            mimeType: file.type,
          },
        },
      });
    } catch (error) {
      console.error("[Event Image Audit]", error);
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
