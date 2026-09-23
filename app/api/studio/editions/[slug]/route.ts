import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { getEditionBySlug } from "@/lib/data/editions";
import { getEditionContent } from "@/lib/services/editionContentService";
import { revalidateEditionPublicCaches } from "@/lib/editions/revalidateEditionCaches";

export const dynamic = "force-dynamic";

/**
 * Delete an edition created in Studio. Super admins only.
 *
 * Only Studio-created editions can go: the original three are defined in
 * lib/data/editions.ts, so removing their rows would leave the public page
 * standing anyway. Uploaded photos stay in the media library, because the
 * same file may be in use on another edition.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const authz = await requireSuperAdmin();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const { slug } = params;
  if (getEditionBySlug(slug)) {
    return NextResponse.json(
      {
        error:
          "This is one of OmaHub's built-in editions and can't be deleted here.",
      },
      { status: 400 },
    );
  }

  try {
    const existing = await getEditionContent(slug, authz.supabase);
    if (!existing) {
      return NextResponse.json({ error: "Edition not found" }, { status: 404 });
    }

    // Photos, video and lineup first, so a failure can't orphan them behind a
    // missing edition.
    for (const table of ["edition_images", "edition_lineup_brands"] as const) {
      const { error } = await authz.supabase
        .from(table)
        .delete()
        .eq("edition_slug", slug);
      if (error) {
        throw new Error(`${table}: ${error.message}`);
      }
    }

    const { error } = await authz.supabase
      .from("edition_content")
      .delete()
      .eq("edition_slug", slug);
    if (error) {
      throw new Error(`edition_content: ${error.message}`);
    }

    revalidateEditionPublicCaches(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("edition_delete_error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete edition",
      },
      { status: 500 },
    );
  }
}
