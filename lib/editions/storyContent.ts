import type { EditionImage } from "@/lib/services/editionImagesService";

/** Split edition story copy into display paragraphs (blank-line separated). */
export function getStoryParagraphs(story: string): string[] {
  return story
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Story-kind images grouped by the paragraph they follow (-1 = before the first). */
export function groupInlineStoryPhotos(
  images: EditionImage[],
): Map<number, EditionImage[]> {
  const grouped = new Map<number, EditionImage[]>();

  for (const image of images) {
    if (image.kind !== "story") continue;
    const list = grouped.get(image.display_order) ?? [];
    list.push(image);
    grouped.set(image.display_order, list);
  }

  for (const [, list] of grouped) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  return grouped;
}

/** Human label for a story photo placement slot. */
export function describeStoryPhotoPosition(
  position: number,
  paragraphCount: number,
): string {
  if (position < 0) return "Before the first paragraph";
  if (position >= paragraphCount) return "After the last paragraph";
  return `After paragraph ${position + 1}`;
}
