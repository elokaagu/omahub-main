import { describe, expect, it } from "vitest";
import {
  editionFromContent,
  slugifyEditionTitle,
  uniqueEditionSlug,
} from "@/lib/editions/editionFromContent";
import { pickAdjacentEditions } from "@/lib/editions/hydrateEditions";
import type { EditionContentRecord } from "@/lib/services/editionContentService";
import type { Edition } from "@/lib/data/editions";

describe("slugifyEditionTitle", () => {
  it("makes a URL-safe slug", () => {
    expect(slugifyEditionTitle("Unboxed: The Body Edition")).toBe(
      "unboxed-the-body-edition",
    );
  });

  it("strips accents, punctuation and edge dashes", () => {
    expect(slugifyEditionTitle("  Été — Lagos!  ")).toBe("ete-lagos");
  });

  it("caps the length without a trailing dash", () => {
    const slug = slugifyEditionTitle("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("uniqueEditionSlug", () => {
  it("keeps a free slug", () => {
    expect(uniqueEditionSlug("edition-04", ["edition-03"])).toBe("edition-04");
  });

  it("appends a counter until it is free", () => {
    expect(
      uniqueEditionSlug("summer", ["summer", "summer-2", "summer-3"]),
    ).toBe("summer-4");
  });
});

const row = (over: Partial<EditionContentRecord> = {}): EditionContentRecord => ({
  edition_slug: "edition-04",
  title: "Edition 04",
  card_title: null,
  excerpt: null,
  story_html: "<p>hi</p>",
  status: "upcoming",
  date_label: "Spring 2027",
  sort_date: "2027-03-01",
  city: "Accra",
  country: "Ghana",
  venue: null,
  partner: null,
  lineup_label: null,
  edition_number: "04",
  applications_open: true,
  theme_announced: false,
  updated_by: null,
  created_at: "2026-09-22T00:00:00Z",
  updated_at: "2026-09-22T00:00:00Z",
  ...over,
});

describe("editionFromContent", () => {
  it("maps a saved row onto an edition", () => {
    expect(editionFromContent(row())).toMatchObject({
      slug: "edition-04",
      number: "04",
      title: "Edition 04",
      cardTitle: "Edition 04",
      status: "upcoming",
      dateLabel: "Spring 2027",
      sortDate: "2027-03-01",
      city: "Accra",
      country: "Ghana",
      brandNames: [],
    });
  });

  it("falls back for a barely-filled row", () => {
    const edition = editionFromContent(
      row({ title: null, edition_number: null, sort_date: null, status: null }),
    );
    expect(edition.title).toBe("Untitled edition");
    expect(edition.status).toBe("upcoming");
    // Created date keeps a new edition in a sensible archive position.
    expect(edition.sortDate).toBe("2026-09-22");
  });
});

describe("pickAdjacentEditions", () => {
  const editions = [
    { slug: "c", sortDate: "2027-01-01" },
    { slug: "a", sortDate: "2025-01-01" },
    { slug: "b", sortDate: "2026-01-01" },
  ] as Edition[];

  it("finds neighbours by date regardless of input order", () => {
    expect(pickAdjacentEditions(editions, "b")).toMatchObject({
      previous: { slug: "a" },
      next: { slug: "c" },
    });
  });

  it("leaves the ends open", () => {
    expect(pickAdjacentEditions(editions, "a").previous).toBeNull();
    expect(pickAdjacentEditions(editions, "c").next).toBeNull();
    expect(pickAdjacentEditions(editions, "zzz")).toEqual({
      previous: null,
      next: null,
    });
  });
});
