import "server-only";

import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing`);
  }

  return value;
}

export const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");

export const supabaseSecretKey = getRequiredEnv("SUPABASE_SECRET_KEY");

export const storageBucket = getRequiredEnv("SUPABASE_STORAGE_BUCKET");

export const blogStorageBucket = getRequiredEnv("SUPABASE_BLOG_STORAGE_BUCKET");

export const eventStorageBucket = getRequiredEnv(
  "SUPABASE_EVENT_STORAGE_BUCKET",
);

/*
 * ========================================
 * PROFILE IMAGES
 * ========================================
 *
 * Bucket اصلی عکس پروفایل.
 *
 * اگر env تعریف نشده باشد،
 * به صورت پیش‌فرض از bucket:
 *
 * profile
 *
 * استفاده می‌کنیم.
 */
export const profileStorageBucket =
  process.env.SUPABASE_PROFILE_STORAGE_BUCKET?.trim() || "profile";

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
