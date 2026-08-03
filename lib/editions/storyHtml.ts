import { getStoryParagraphs } from "@/lib/editions/storyContent";

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
    "edition-story-prose mt-5 font-canela text-xl leading-relaxed text-oma-black sm:mt-6 sm:text-2xl lg:text-3xl",
    "[&_p]:mb-6 [&_p:last-child]:mb-0",
    "[&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-normal",
    "[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-normal",
    "[&_img]:my-8 [&_img]:w-full [&_img]:rounded-2xl",
    "[&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6",
    "[&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6",
    "[&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-oma-plum/40 [&_blockquote]:pl-4 [&_blockquote]:text-oma-cocoa",
  ].join(" ");
}
