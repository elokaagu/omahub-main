/** Shortest query worth sending to the server. */
export const MIN_QUERY_LENGTH = 2;
/** Longer input is truncated - nobody searches a paragraph. */
export const MAX_QUERY_LENGTH = 60;

/**
 * Clean raw input into a query that is safe to embed in a PostgREST
 * `ilike` / `.or()` filter, or null when it's too short to search.
 *
 * `,` `(` `)` are `.or()` syntax, `%` `_` are ilike wildcards, and `\` `*`
 * `:` and quotes have meaning in filter strings - they're replaced by spaces
 * rather than escaped, since they almost never matter for a name search.
 */
export function normaliseSearchQuery(
  raw: string | null | undefined,
): string | null {
  const query = (raw ?? "")
    .normalize("NFKC")
    .replace(/[,()%_\\*:"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .trim();
  return query.length >= MIN_QUERY_LENGTH ? query : null;
}

/** Lowercase and strip accents, so "Adèle" matches "adele". */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** True when every word of the query appears somewhere in the text. */
export function matchesAllTerms(text: string, query: string): boolean {
  const haystack = foldText(text);
  return foldText(query)
    .split(" ")
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

/**
 * Relevance of a title to the query, lower is better: whole-title prefix,
 * then a word starting with the query, then anywhere in the title, then
 * matched only on another field (category, location, ...).
 */
export function titleRank(title: string, query: string): number {
  const t = foldText(title);
  const q = foldText(query);
  if (t.startsWith(q)) return 0;
  if (t.split(/[\s\-–—&/]+/).some((word) => word.startsWith(q))) return 1;
  if (t.includes(q)) return 2;
  return 3;
}

/** Stable sort by `titleRank`, keeping the original order within a rank. */
export function sortByRelevance<T>(
  items: T[],
  query: string,
  getTitle: (item: T) => string,
): T[] {
  return items
    .map((item, index) => ({ item, index, rank: titleRank(getTitle(item), query) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}
