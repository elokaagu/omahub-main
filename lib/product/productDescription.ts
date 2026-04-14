/** Split rich-text description into paragraphs; safe when `description` is null/empty. */
export function splitProductDescription(
  description: string | null | undefined
): string[] {
  if (description == null || String(description).trim() === "") {
    return [];
  }
  return String(description)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
