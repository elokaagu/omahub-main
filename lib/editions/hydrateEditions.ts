import type { Edition } from "@/lib/data/editions";
import { getAllEditions } from "@/lib/data/editions";
import {
  getAllEditionContent,
  mergeEditionWithContent,
} from "@/lib/services/editionContentService";
import { getAllEditionImages } from "@/lib/services/editionImagesService";
import { getAllEditionLineupBrands } from "@/lib/services/editionLineupService";
import { editionFromContent } from "./editionFromContent";

function lineupCountLabel(count: number): string {
  return `${count} designer${count === 1 ? "" : "s"}`;
}

/**
 * Overlay Studio-saved copy, covers, and lineup counts onto the static
 * edition seed so homepage, archive, and heroes show the live fields.
 */
export function applyStudioEditionOverlays(
  staticEditions: Edition[],
  contentRows: Awaited<ReturnType<typeof getAllEditionContent>>,
  imageRows: Awaited<ReturnType<typeof getAllEditionImages>>,
  lineupRows: Awaited<ReturnType<typeof getAllEditionLineupBrands>>,
): Edition[] {
  const contentBySlug = new Map(
    contentRows.map((row) => [row.edition_slug, row]),
  );
  const coverBySlug = new Map(
    imageRows
      .filter((image) => image.kind === "cover")
      .map((image) => [image.edition_slug, image.image_url]),
  );
  const lineupCountBySlug = new Map<string, number>();
  for (const row of lineupRows) {
    lineupCountBySlug.set(
      row.edition_slug,
      (lineupCountBySlug.get(row.edition_slug) ?? 0) + 1,
    );
  }

  const overlaySeeded = staticEditions.map((edition) => {
    const content = contentBySlug.get(edition.slug) ?? null;
    const merged = mergeEditionWithContent(edition, content);
    const lineupCount = lineupCountBySlug.get(edition.slug) ?? 0;
    const studioLineupLabel = content?.lineup_label?.trim();

    return {
      ...merged,
      coverImage: coverBySlug.get(edition.slug) || merged.coverImage,
      lineupLabel:
        studioLineupLabel ||
        (lineupCount > 0 ? lineupCountLabel(lineupCount) : merged.lineupLabel),
    };
  });

  // Editions created in Studio have no entry in lib/data/editions.ts.
  const seededSlugs = new Set(staticEditions.map((edition) => edition.slug));
  const studioCreated = contentRows
    .filter((row) => !seededSlugs.has(row.edition_slug))
    .map((row) => {
      const edition = editionFromContent(row);
      const lineupCount = lineupCountBySlug.get(row.edition_slug) ?? 0;
      return {
        ...edition,
        coverImage: coverBySlug.get(row.edition_slug) || edition.coverImage,
        lineupLabel:
          edition.lineupLabel ||
          (lineupCount > 0 ? lineupCountLabel(lineupCount) : undefined),
      };
    });

  return [...overlaySeeded, ...studioCreated].sort((a, b) =>
    b.sortDate.localeCompare(a.sortDate),
  );
}

export async function getHydratedEditions(): Promise<Edition[]> {
  const staticEditions = getAllEditions();

  const [contentRows, imageRows, lineupRows] = await Promise.all([
    getAllEditionContent(),
    getAllEditionImages(),
    getAllEditionLineupBrands(),
  ]);

  return applyStudioEditionOverlays(
    staticEditions,
    contentRows,
    imageRows,
    lineupRows,
  );
}

/** One hydrated edition, including Studio-created ones. */
export async function getHydratedEditionBySlug(
  slug: string,
): Promise<Edition | null> {
  const editions = await getHydratedEditions();
  return editions.find((edition) => edition.slug === slug) ?? null;
}

/** The editions either side of `slug` in date order (oldest -> newest). */
export function pickAdjacentEditions(
  editions: Edition[],
  slug: string,
): { previous: Edition | null; next: Edition | null } {
  const oldestFirst = [...editions].sort((a, b) =>
    a.sortDate.localeCompare(b.sortDate),
  );
  const index = oldestFirst.findIndex((edition) => edition.slug === slug);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: oldestFirst[index - 1] ?? null,
    next: oldestFirst[index + 1] ?? null,
  };
}

export function pickUpcomingEdition(editions: Edition[]): Edition | null {
  const upcoming = editions
    .filter((edition) => edition.status === "upcoming")
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  return upcoming[0] ?? null;
}

export function pickPastEditions(editions: Edition[], limit?: number): Edition[] {
  const past = editions
    .filter((edition) => edition.status === "past")
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate));
  return typeof limit === "number" ? past.slice(0, limit) : past;
}
