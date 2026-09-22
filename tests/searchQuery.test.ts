import { describe, expect, it } from "vitest";
import {
  MAX_QUERY_LENGTH,
  matchesAllTerms,
  normaliseSearchQuery,
  sortByRelevance,
  titleRank,
} from "@/lib/search/searchQuery";
import { searchSitePages } from "@/lib/search/searchPages";

describe("normaliseSearchQuery", () => {
  it("trims and collapses whitespace", () => {
    expect(normaliseSearchQuery("  lagos   bridal ")).toBe("lagos bridal");
  });

  it("returns null for empty or one-character input", () => {
    expect(normaliseSearchQuery("")).toBeNull();
    expect(normaliseSearchQuery(" a ")).toBeNull();
    expect(normaliseSearchQuery(null)).toBeNull();
  });

  it("strips characters that are PostgREST filter syntax or ilike wildcards", () => {
    // Commas/brackets could otherwise inject extra .or() conditions.
    expect(normaliseSearchQuery("x,id.eq.1)")).toBe("x id.eq.1");
    expect(normaliseSearchQuery("100%_cotton")).toBe("100 cotton");
    expect(normaliseSearchQuery('"quoted" \\path*')).toBe("quoted path");
  });

  it("caps the length", () => {
    expect(normaliseSearchQuery("a".repeat(200))).toHaveLength(MAX_QUERY_LENGTH);
  });
});

describe("matchesAllTerms", () => {
  it("needs every word, in any order, ignoring case and accents", () => {
    expect(matchesAllTerms("Adèle Couture, Lagos", "lagos adele")).toBe(true);
    expect(matchesAllTerms("Adèle Couture, Lagos", "lagos accra")).toBe(false);
  });
});

describe("titleRank / sortByRelevance", () => {
  it("ranks a title prefix above a word prefix above a substring", () => {
    expect(titleRank("Kente House", "kente")).toBe(0);
    expect(titleRank("House of Kente", "kente")).toBe(1);
    expect(titleRank("Akentea", "kente")).toBe(2);
    expect(titleRank("Lagos Studio", "kente")).toBe(3);
  });

  it("orders by rank, keeping the original order within a rank", () => {
    const sorted = sortByRelevance(
      ["Lagos Studio", "House of Kente", "Kente B", "Kente A"],
      "kente",
      (t) => t,
    );
    expect(sorted).toEqual(["Kente B", "Kente A", "House of Kente", "Lagos Studio"]);
  });
});

describe("searchSitePages", () => {
  it("finds pages by title or keyword", () => {
    expect(searchSitePages("tailor").map((p) => p.url)).toContain("/tailored");
    expect(searchSitePages("apply").map((p) => p.url)).toContain("/join");
  });

  it("never leaks the internal keywords field", () => {
    for (const hit of searchSitePages("designers")) {
      expect(hit).not.toHaveProperty("keywords");
    }
  });
});
