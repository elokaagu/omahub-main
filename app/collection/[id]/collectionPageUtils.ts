/** Supabase PostgREST: no row returned for .single() */
export function isPostgrestNoRowsError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "PGRST116"
  );
}

/** Split rich text on double newlines; safe for null/undefined. */
export function splitParagraphs(text: string | null | undefined): string[] {
  if (text == null || String(text).trim() === "") {
    return [];
  }
  return String(text)
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Hero / product thumbnails: upper-body bias for fashion imagery. */
export const CATALOGUE_IMAGE_OBJECT_CLASS =
  "object-cover object-center object-top";

/** Fisher–Yates shuffle (copy); use once after fetch for stable session UX. */
export function shuffleCopy<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
