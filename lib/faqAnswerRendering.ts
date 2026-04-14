/** Detect TipTap / rich HTML answers vs plain text. */
export function faqAnswerLooksLikeHtml(s: string): boolean {
  return /<\/[a-z][\s\S]*>|<br\s*\/?>|<p[\s/>]/i.test(s);
}

/** Plain text for JSON-LD / snippets (strips simple HTML). */
export function faqAnswerPlainText(htmlOrText: string): string {
  if (!htmlOrText?.trim()) return "";
  return htmlOrText
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
