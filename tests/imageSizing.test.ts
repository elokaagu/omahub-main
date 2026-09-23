import { describe, expect, it } from "vitest";
import {
  FOCAL_POINTS,
  IMAGE_QUALITY,
  IMAGE_SIZES,
  objectPositionFor,
} from "@/lib/images/imageSizing";

describe("objectPositionFor", () => {
  it("resolves a named point", () => {
    expect(objectPositionFor("portrait")).toBe(FOCAL_POINTS.portrait);
  });

  it("passes a raw CSS position through", () => {
    expect(objectPositionFor("20% 80%")).toBe("20% 80%");
  });

  it("centres when nothing is given", () => {
    expect(objectPositionFor()).toBe(FOCAL_POINTS.center);
  });
});

describe("image presets", () => {
  it("holds faces above centre so wide crops keep them", () => {
    // A centred crop on a wide hero cuts heads off - that is the whole point.
    const vertical = Number(FOCAL_POINTS.portrait.split(" ")[1].replace("%", ""));
    expect(vertical).toBeLessThan(50);
  });

  it("gives every size preset a media-query fallback width", () => {
    Object.values(IMAGE_SIZES).forEach((value) => {
      expect(value.trim().length).toBeGreaterThan(0);
      // The last entry must be an unconditional width, or the browser has
      // nothing to fall back to and assumes 100vw.
      const last = value.split(",").pop()!.trim();
      expect(last).not.toContain("max-width");
    });
  });

  it("keeps photography above the Next.js default of 75", () => {
    expect(IMAGE_QUALITY.hero).toBeGreaterThan(75);
    expect(IMAGE_QUALITY.standard).toBeGreaterThan(75);
  });
});
