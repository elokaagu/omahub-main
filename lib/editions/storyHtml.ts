import { getStoryParagraphs, groupInlineStoryPhotos } from "@/lib/editions/storyContent";
import type { EditionImage } from "@/lib/services/editionImagesService";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convert legacy plain-text story paragraphs to TipTap-friendly HTML. */
export function plainStoryToHtml(story: string): string {
  const paragraphs = getStoryParagraphs(story);
  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

export function hasRichStoryHtml(html: string | null | undefined): boolean {
  if (!html) return false;
  const stripped = html.replace(/<[^>]+>/g, "").trim();
  return stripped.length > 0;
}

/** Shared prose styling for rendered edition stories on the public site. */
export function createEditionStoryProseClassName(): string {
  return [
    "edition-story-prose mt-5 font-canela text-base leading-relaxed text-oma-black sm:mt-6 sm:text-lg lg:text-xl",
    "[&_p]:mb-6 [&_p:last-child]:mb-0",
    "[&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-normal sm:[&_h2]:text-3xl",
    "[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-normal sm:[&_h3]:text-2xl",
    "[&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-normal sm:[&_h4]:text-xl",
    "[&_img]:my-8 [&_img]:w-full [&_img]:rounded-2xl",
    "[&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6",
    "[&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6",
    "[&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-oma-plum/40 [&_blockquote]:pl-4 [&_blockquote]:text-oma-cocoa",
  ].join(" ");
}

function storyHtmlContainsImages(html: string): boolean {
  return /<img\b/i.test(html);
}

function legacyStoryImageTag(photo: EditionImage): string {
  const alt = photo.alt_text ? escapeHtml(photo.alt_text) : "";
  const src = photo.image_url.replace(/"/g, "&quot;");
  return `<img src="${src}" alt="${alt}" class="edition-inline-image" />`;
}

/**
 * Embed legacy paragraph-indexed story photos into rich HTML so they remain
 * visible after converting from plain text (and editable in the TipTap editor).
 */
export function mergeLegacyStoryPhotosIntoHtml(
  storyHtml: string,
  storyPhotos: EditionImage[],
): string {
  if (storyPhotos.length === 0 || storyHtmlContainsImages(storyHtml)) {
    return storyHtml;
  }

  const grouped = groupInlineStoryPhotos(storyPhotos);
  const paragraphRegex = /<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi;
  const paragraphs = storyHtml.match(paragraphRegex) ?? [];

  if (paragraphs.length === 0) {
    return storyHtml;
  }

  const chunks: string[] = [];

  for (const photo of grouped.get(-1) ?? []) {
    chunks.push(legacyStoryImageTag(photo));
  }

  paragraphs.forEach((paragraph, index) => {
    chunks.push(paragraph);
    for (const photo of grouped.get(index) ?? []) {
      chunks.push(legacyStoryImageTag(photo));
    }
  });

  for (const photo of grouped.get(paragraphs.length) ?? []) {
    chunks.push(legacyStoryImageTag(photo));
  }

  return chunks.join("");
}
