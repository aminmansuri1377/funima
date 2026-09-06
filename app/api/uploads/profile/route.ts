import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/server/db/prisma";

import { profileStorageBucket, supabaseAdmin } from "@/server/supabase/storage";

export const runtime = "nodejs";

/*
 * ========================================
 * CONFIG
 * ========================================
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/*
 * ========================================
 * HELPERS
 * ========================================
 */

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

function getStoragePathFromPublicUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    const marker = `/storage/v1/object/public/` + `${profileStorageBucket}/`;

    const index = url.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    const path = url.pathname.slice(index + marker.length);

    if (!path) {
      return null;
    }

    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

function jsonError({
  error,
  message,
  status,
}: {
  error: string;

  message: string;

  status: number;
}) {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
    },
    {
      status,
    },
  );
}

/*
 * ========================================
 * POST
 * ========================================
 */

export async function POST(request: Request) {
  /*
   * ----------------------------------------
   * AUTH
   * ----------------------------------------
   */

  const session = await auth();

  const userId = session?.user?.id;

  if (!userId) {
    return jsonError({
      error: "UNAUTHORIZED",

      message: "برای تغییر تصویر پروفایل ابتدا وارد حساب شوید.",

      status: 401,
    });
  }

  /*
   * ----------------------------------------
   * FORM DATA
   * ----------------------------------------
   */

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError({
      error: "INVALID_FORM_DATA",

      message: "اطلاعات ارسال‌شده معتبر نیست.",

      status: 400,
    });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError({
      error: "FILE_REQUIRED",

      message: "لطفاً یک تصویر انتخاب کنید.",

      status: 400,
    });
  }

  /*
   * ----------------------------------------
   * EMPTY FILE
   * ----------------------------------------
   */

  if (file.size === 0) {
    return jsonError({
      error: "EMPTY_FILE",

      message: "فایل انتخاب‌شده خالی است.",

      status: 400,
    });
  }

  /*
   * ----------------------------------------
   * MIME TYPE
   * ----------------------------------------
   */

  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonError({
      error: "INVALID_FILE_TYPE",

      message: "فرمت تصویر باید JPG، PNG، WebP یا AVIF باشد.",

      status: 400,
    });
  }

  /*
   * ----------------------------------------
   * FILE SIZE
   * ----------------------------------------
   */

  if (file.size > MAX_FILE_SIZE) {
    return jsonError({
      error: "FILE_TOO_LARGE",

      message: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.",

      status: 400,
    });
  }

  /*
   * ----------------------------------------
   * EXTENSION
   * ----------------------------------------
   */

  const extension = getExtension(file);

  if (!extension) {
    return jsonError({
      error: "INVALID_EXTENSION",

      message: "فرمت تصویر پشتیبانی نمی‌شود.",

      status: 400,
    });
  }

  /*
   * ----------------------------------------
   * CURRENT USER
   * ----------------------------------------
   */

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      profileImage: true,
    },
  });

  if (!user) {
    return jsonError({
      error: "USER_NOT_FOUND",

      message: "حساب کاربری پیدا نشد.",

      status: 404,
    });
  }

  /*
   * ----------------------------------------
   * STORAGE PATH
   * ----------------------------------------
   *
   * برای هر upload یک URL جدید می‌سازیم.
   *
   * مزیت:
   * Browser / CDN عکس قدیمی را cache
   * نمی‌کنند.
   */

  const storagePath = `users/${user.id}/` + `${randomUUID()}.${extension}`;

  /*
   * ----------------------------------------
   * FILE BUFFER
   * ----------------------------------------
   */

  const bytes = new Uint8Array(await file.arrayBuffer());

  /*
   * ----------------------------------------
   * UPLOAD
   * ----------------------------------------
   */

  const upload = await supabaseAdmin.storage
    .from(profileStorageBucket)
    .upload(storagePath, bytes, {
      contentType: file.type,

      cacheControl: "31536000",

      upsert: false,
    });

  if (upload.error) {
    console.error("[Profile Upload]", upload.error);

    return jsonError({
      error: "UPLOAD_FAILED",

      message: "آپلود تصویر پروفایل انجام نشد.",

      status: 500,
    });
  }

  /*
   * ----------------------------------------
   * PUBLIC URL
   * ----------------------------------------
   */

  const { data: publicData } = supabaseAdmin.storage
    .from(profileStorageBucket)
    .getPublicUrl(storagePath);

  const profileImage = publicData.publicUrl;

  /*
   * ----------------------------------------
   * UPDATE USER
   * ----------------------------------------
   */

  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        profileImage,
      },
    });
  } catch (error) {
    /*
     * اگر آپلود موفق بود ولی DB
     * آپدیت نشد، فایل orphan نماند.
     */

    await supabaseAdmin.storage
      .from(profileStorageBucket)
      .remove([storagePath]);

    console.error("[Profile DB Update]", error);

    return jsonError({
      error: "PROFILE_UPDATE_FAILED",

      message: "ذخیره تصویر پروفایل انجام نشد.",

      status: 500,
    });
  }

  /*
   * ----------------------------------------
   * REMOVE OLD IMAGE
   * ----------------------------------------
   *
   * فقط وقتی عکس قبلی واقعاً متعلق به
   * همین bucket باشد حذفش می‌کنیم.
   *
   * اگر عکس قبلی URL خارجی باشد،
   * دست نمی‌زنیم.
   */

  const oldStoragePath = getStoragePathFromPublicUrl(user.profileImage);

  if (oldStoragePath && oldStoragePath !== storagePath) {
    const removeOld = await supabaseAdmin.storage
      .from(profileStorageBucket)
      .remove([oldStoragePath]);

    if (removeOld.error) {
      /*
       * حذف نشدن عکس قبلی نباید باعث
       * شکست upload جدید شود.
       */

      console.error("[Profile Old Image Remove]", removeOld.error);
    }
  }

  /*
   * ----------------------------------------
   * RESPONSE
   * ----------------------------------------
   */

  return NextResponse.json({
    success: true,

    profileImage,
  });
}
