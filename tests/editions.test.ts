import { describe, expect, it } from "vitest";
import {
  editionDisplayTitle,
  getAdjacentEditions,
  getAllEditions,
  getEditionBySlug,
} from "@/lib/data/editions";

describe("getAdjacentEditions", () => {
  const oldestFirst = [...getAllEditions()].reverse();

  it("links each edition to its older and newer neighbour", () => {
    oldestFirst.forEach((edition, i) => {
      const { previous, next } = getAdjacentEditions(edition.slug);
      expect(previous?.slug ?? null).toBe(oldestFirst[i - 1]?.slug ?? null);
      expect(next?.slug ?? null).toBe(oldestFirst[i + 1]?.slug ?? null);
    });
  });

  it("has no neighbours for an unknown slug", () => {
    expect(getAdjacentEditions("nope")).toEqual({ previous: null, next: null });
  });
});

describe("built-in editions", () => {
  // DELETE /api/studio/editions/[slug] refuses any slug this resolves, so a
  // built-in edition can never be deleted from Studio.
  it("are all resolvable by slug", () => {
    getAllEditions().forEach((edition) => {
      expect(getEditionBySlug(edition.slug)).toBeTruthy();
    });
  });

  it("does not resolve a Studio-created slug", () => {
    expect(getEditionBySlug("delete-button-test")).toBeFalsy();
  });
});

describe("editionDisplayTitle", () => {
  it("hides an unannounced upcoming theme", () => {
    const upcoming = getAllEditions().find(
      (e) => e.status === "upcoming" && !e.themeAnnounced,
    );
    if (upcoming) {
      expect(editionDisplayTitle(upcoming)).toBe(`Edition ${upcoming.number}: TBA`);
    }
  });

  it("uses the real title for past editions", () => {
    const past = getAllEditions().find((e) => e.status === "past")!;
    expect(editionDisplayTitle(past)).toBe(past.title);
  });
});
