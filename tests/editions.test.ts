import { describe, expect, it } from "vitest";
import {
  editionDisplayTitle,
  getAdjacentEditions,
  getAllEditions,
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
