import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { getEditionBySlug } from "@/lib/data/editions";
import { revalidateEditionPublicCaches } from "@/lib/editions/revalidateEditionCaches";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const authz = await requireSuperAdmin();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  if (!getEditionBySlug(params.slug)) {
    return NextResponse.json({ error: "Edition not found" }, { status: 404 });
  }

  revalidateEditionPublicCaches(params.slug);
  console.log("edition_revalidate_ok", { slug: params.slug });
  return NextResponse.json({ success: true });
}
