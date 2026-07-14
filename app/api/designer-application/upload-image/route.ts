import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminClient } from "@/lib/supabase-admin";
import {
  checkDesignerApplicationImageUploadRateLimit,
} from "@/lib/rate-limit/designerApplicationImageUploadRateLimit";
import { getDesignerApplicationClientKey } from "@/lib/rate-limit/designerApplicationRateLimit";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Public, unauthenticated upload for the /join application form (applicants
 * don't have an account yet, so the shared FileUpload component - which
 * requires a signed-in session - can't be used here). Uses the service-role
 * client since anonymous requests have no storage RLS grant of their own;
 * validation below is what keeps this endpoint safe to expose publicly.
 */
export async function POST(request: NextRequest) {
  try {
    if (
      !checkDesignerApplicationImageUploadRateLimit(
        getDesignerApplicationClientKey(request),
      )
    ) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, or WebP images are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Image must be 8MB or smaller" },
        { status: 400 },
      );
    }

    const supabase = await getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    const path = `applications/${randomUUID()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("designer_app_image_upload_failed", uploadError.message);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("brand-assets").getPublicUrl(path);

    return NextResponse.json({ success: true, url: publicUrl, path });
  } catch (error) {
    console.error(
      "designer_app_image_upload_unhandled",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
