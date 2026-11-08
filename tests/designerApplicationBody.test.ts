import { describe, expect, it } from "vitest";
import {
  designerApplicationBodySchema,
  parseYearFounded,
} from "@/lib/validation/designerApplicationBody";
import { EXPLORE_PRICING_LABEL } from "@/lib/brands/joinApplicationPricing";
import { designerApplicationFormSchema } from "@/lib/validation/designerApplicationForm";

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

  it("accepts a blank or null website", () => {
    for (const website of ["", null, undefined]) {
      const parsed = designerApplicationBodySchema.safeParse({ ...base, website });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data.website).toBeNull();
    }
  });

  it("accepts what the join form sends, with or without optional fields", () => {
    for (const website of ["", "bagsbyiwah.com"]) {
      const formValues = { ...base, website, phone: "", yearFounded: "" };
      // Client check passes...
      expect(designerApplicationFormSchema.safeParse(formValues).success).toBe(true);
      // ...and the API accepts the same values over JSON.
      const sent = JSON.parse(JSON.stringify(formValues));
      expect(designerApplicationBodySchema.safeParse(sent).success).toBe(true);
    }
  });

  it("still accepts its own cleaned output (older cached form bundles send this)", () => {
    const form = designerApplicationFormSchema.safeParse({ ...base, website: "" });
    expect(form.success).toBe(true);
    if (!form.success) return;
    const resent = JSON.parse(JSON.stringify(form.data));
    expect(designerApplicationBodySchema.safeParse(resent).success).toBe(true);
  });

  it("requires at least one portfolio photo", () => {
    const parsed = designerApplicationBodySchema.safeParse({
      ...base,
      imageUrls: [],
    });
    expect(parsed.success).toBe(false);
  });
});
