import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import {
  getEditionContent,
  upsertEditionContent,
  type EditionContentInput,
} from "@/lib/services/editionContentService";
import { getEditionBySlug } from "@/lib/data/editions";
import { editionFromContent } from "@/lib/editions/editionFromContent";
import { revalidateEditionPublicCaches } from "@/lib/editions/revalidateEditionCaches";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const authz = await requireSuperAdmin();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const content = await getEditionContent(params.slug, authz.supabase);
  // Studio-created editions have no entry in lib/data/editions.ts.
  const staticEdition =
    getEditionBySlug(params.slug) ?? (content ? editionFromContent(content) : null);
  if (!staticEdition) {
    return NextResponse.json({ error: "Edition not found" }, { status: 404 });
  }

  return NextResponse.json({ content, staticEdition });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const authz = await requireSuperAdmin();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  if (!getEditionBySlug(params.slug)) {
    // Not seeded: only allow saving against an edition created in Studio.
    const existing = await getEditionContent(params.slug, authz.supabase);
    if (!existing) {
      return NextResponse.json({ error: "Edition not found" }, { status: 404 });
    }
  }

  let body: EditionContentInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const saved = await upsertEditionContent(
      authz.userId,
      params.slug,
      body,
      authz.supabase,
    );
    revalidateEditionPublicCaches(params.slug);
    return NextResponse.json({ success: true, content: saved });
  } catch (error) {
    console.error("edition_content_save_error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save edition",
      },
      { status: 500 },
    );
  }
}
