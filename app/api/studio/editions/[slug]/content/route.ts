import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import {
  getEditionContent,
  upsertEditionContent,
  type EditionContentInput,
} from "@/lib/services/editionContentService";
import { getEditionBySlug } from "@/lib/data/editions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const authz = await requireSuperAdmin();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const staticEdition = getEditionBySlug(params.slug);
  if (!staticEdition) {
    return NextResponse.json({ error: "Edition not found" }, { status: 404 });
  }

  const content = await getEditionContent(params.slug);
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

  const staticEdition = getEditionBySlug(params.slug);
  if (!staticEdition) {
    return NextResponse.json({ error: "Edition not found" }, { status: 404 });
  }

  let body: EditionContentInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const saved = await upsertEditionContent(authz.userId, params.slug, body);
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
