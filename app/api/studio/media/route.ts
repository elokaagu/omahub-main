import { NextRequest, NextResponse } from "next/server";
import { permissionsForProfileRole } from "@/lib/services/permissionsService";
import { getStudioSession } from "@/lib/studio/session";
import {
  MEDIA_BUCKETS,
  listStudioMedia,
  type MediaBucketId,
} from "@/lib/studio/mediaLibrary";

export const dynamic = "force-dynamic";

const ALLOWED = new Set<string>(MEDIA_BUCKETS.map((bucket) => bucket.id));

/**
 * GET /api/studio/media?bucket=&q= - images already uploaded to OmaHub, for
 * the "choose existing" picker. Any Studio user may browse them; every
 * bucket listed here is public anyway.
 */
export async function GET(request: NextRequest) {
  const { supabase, profile } = await getStudioSession();
  if (!permissionsForProfileRole(profile?.role).includes("studio.access")) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const bucket = params.get("bucket") ?? MEDIA_BUCKETS[0].id;
  if (!ALLOWED.has(bucket)) {
    return NextResponse.json({ error: "Unknown bucket" }, { status: 400 });
  }

  try {
    const items = await listStudioMedia(
      supabase,
      bucket as MediaBucketId,
      params.get("q") ?? "",
    );
    return NextResponse.json({ items, buckets: MEDIA_BUCKETS });
  } catch (error) {
    console.error("studio_media_list_error", error);
    return NextResponse.json(
      { error: "Failed to load images" },
      { status: 500 },
    );
  }
}
