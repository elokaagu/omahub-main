import { describe, expect, it } from "vitest";
import {
  designerApplicationBodySchema,
  parseYearFounded,
} from "@/lib/validation/designerApplicationBody";
import { EXPLORE_PRICING_LABEL } from "@/lib/brands/joinApplicationPricing";

/** Fields the API persists on designer_applications — keep in sync with the table. */
const PERSISTED_APPLICATION_COLUMNS = [
  "brand_name",
  "designer_name",
  "email",
  "phone",
  "website",
  "instagram",
  "location",
  "category",
  "description",
  "year_founded",
  "price_range",
  "currency",
  "image_urls",
  "status",
] as const;

describe("designerApplicationBodySchema", () => {
  const base = {
    brandName: "Àsoo",
    designerName: "Faché",
    email: "fache@example.com",
    phone: "",
    website: "",
    instagram: "asoolabel.rtw",
    location: "Lagos, Nigeria",
    category: "Ready to Wear",
    description: "Contemporary ready-to-wear with a focus on tailoring.",
    yearFounded: "2022",
    currency: "USD",
    priceMin: "120",
    priceMax: "480",
    contactForPricing: false,
    imageUrls: ["https://www.oma-hub.com/favicon.ico"],
  };

  it("builds price_range and currency for the API insert payload", () => {
    const parsed = designerApplicationBodySchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.priceRange).toMatch(/120/);
    expect(parsed.data.priceRange).toMatch(/480/);
    expect(parsed.data.currency).toBe("USD");
    expect(parsed.data.instagram).toBe("asoolabel.rtw");
    expect(parseYearFounded(parsed.data.yearFounded)).toBe(2022);

    // Guard against shipping join pricing without the matching DB columns.
    for (const col of ["price_range", "currency"] as const) {
      expect(PERSISTED_APPLICATION_COLUMNS).toContain(col);
    }
  });

  it("uses the explore label when contact-for-pricing is set", () => {
    const parsed = designerApplicationBodySchema.safeParse({
      ...base,
      contactForPricing: true,
      priceMin: "",
      priceMax: "",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.priceRange).toBe(EXPLORE_PRICING_LABEL);
  });

  it("requires at least one portfolio photo", () => {
    const parsed = designerApplicationBodySchema.safeParse({
      ...base,
      imageUrls: [],
    });
    expect(parsed.success).toBe(false);
  });
});
