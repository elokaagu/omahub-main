import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { getAllEditions } from "@/lib/data/editions";
import {
  getAllEditionContent,
  upsertEditionContent,
} from "@/lib/services/editionContentService";
import {
  slugifyEditionTitle,
  uniqueEditionSlug,
} from "@/lib/editions/editionFromContent";
import { revalidateEditionPublicCaches } from "@/lib/editions/revalidateEditionCaches";

export const dynamic = "force-dynamic";

const createEditionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  number: z.string().trim().max(10).optional(),
  status: z.enum(["upcoming", "past"]).default("upcoming"),
  dateLabel: z.string().trim().max(60).optional(),
  sortDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
});

/** Create an edition (Studio > Editions > New edition). Super admins only. */
export async function POST(request: NextRequest) {
  const authz = await requireSuperAdmin();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createEditionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  try {
    // Unique across both the seeded editions and any created earlier.
    const existing = await getAllEditionContent(authz.supabase);
    const taken = [
      ...getAllEditions().map((edition) => edition.slug),
      ...existing.map((row) => row.edition_slug),
    ];
    const base = slugifyEditionTitle(input.title) || "edition";
    const slug = uniqueEditionSlug(base, taken);

    const content = await upsertEditionContent(
      authz.userId,
      slug,
      {
        title: input.title,
        card_title: input.title,
        status: input.status,
        ...(input.number ? { edition_number: input.number } : {}),
        ...(input.dateLabel ? { date_label: input.dateLabel } : {}),
        ...(input.sortDate ? { sort_date: input.sortDate } : {}),
        ...(input.city ? { city: input.city } : {}),
        ...(input.country ? { country: input.country } : {}),
      },
      authz.supabase,
    );

    revalidateEditionPublicCaches(slug);
    return NextResponse.json({ success: true, slug, content }, { status: 201 });
  } catch (error) {
    console.error("edition_create_error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create edition",
      },
      { status: 500 },
    );
  }
}
