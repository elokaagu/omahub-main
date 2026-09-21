import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { getAdminClient } from "@/lib/supabase-admin";

const ALLOWED_BUCKETS = new Set([
  "edition-galleries",
  "brand-assets",
  "brand-images",
  "product-images",
  "hero-images",
  "spotlight-images",
  "product-videos",
  "spotlight-videos",
  "avatars",
]);

const ALLOWED_ROLES = new Set(["super_admin", "admin", "brand_admin"]);

function isSafeStoragePath(path: string): boolean {
  if (!path || path.length > 500) return false;
  if (path.startsWith("/") || path.includes("..") || path.includes("\\")) {
    return false;
  }
  return /^[a-zA-Z0-9._/-]+$/.test(path);
}

/**
 * Creates a short-lived signed upload URL so the browser can PUT the file
 * straight to Storage. That avoids RLS failures on buckets like
 * edition-galleries, and keeps large photos off the Vercel request body limit.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || !ALLOWED_ROLES.has(profile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    let body: { bucket?: string; path?: string; contentType?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const bucket = (body.bucket || "").trim();
    const path = (body.path || "").trim();

    if (!ALLOWED_BUCKETS.has(bucket) || !isSafeStoragePath(path)) {
      return NextResponse.json({ error: "Invalid upload target" }, { status: 400 });
    }

    const admin = await getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Upload signing is unavailable" },
        { status: 500 },
      );
    }

    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data?.token || !data?.path) {
      console.error("studio_upload_sign_failed", error?.message || "missing token");
      return NextResponse.json(
        { error: "Could not create an upload URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      bucket,
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      contentType: body.contentType || undefined,
    });
  } catch (error) {
    console.error(
      "studio_upload_sign_unhandled",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
