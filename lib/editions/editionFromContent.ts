import type { Edition } from "@/lib/data/editions";
import type { EditionContentRecord } from "@/lib/services/editionContentService";

/** Turn a title into a URL slug: "Unboxed: The Body" -> "unboxed-the-body". */
export function slugifyEditionTitle(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Append -2, -3 … until the slug is free. */
export function uniqueEditionSlug(
  base: string,
  taken: Iterable<string>,
): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Build an Edition from a Studio-created row (one with no entry in
 * lib/data/editions.ts). Seeded editions keep using mergeEditionWithContent.
 */
export function editionFromContent(row: EditionContentRecord): Edition {
  const title = row.title?.trim() || "Untitled edition";
  return {
    slug: row.edition_slug,
    number: row.edition_number?.trim() || "",
    title,
    cardTitle: row.card_title?.trim() || title,
    status: row.status ?? "upcoming",
    dateLabel: row.date_label?.trim() || "",
    sortDate: row.sort_date || row.created_at?.slice(0, 10) || "",
    city: row.city?.trim() || "",
    country: row.country?.trim() || "",
    venue: row.venue?.trim() || undefined,
    partner: row.partner?.trim() || undefined,
    lineupLabel: row.lineup_label?.trim() || undefined,
    excerpt: row.excerpt?.trim() || "",
    // Story lives in `story_html` for Studio-created editions; the plain-text
    // `story` field is only used by the older seeded ones.
    story: "",
    brandNames: [],
    applicationsOpen: row.applications_open ?? undefined,
    themeAnnounced: row.theme_announced ?? undefined,
  };
}
