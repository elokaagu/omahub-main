/**
 * Guards the /join application against "the form says OK but the server says no".
 *
 * Every test builds the request exactly as the form does
 * (buildJoinApplicationPayload) and checks two things:
 *   1. the form's own validation accepts it, and
 *   2. the API's validation accepts the same JSON.
 * If the form ever lets something through that the API rejects, these fail.
 */
import { describe, expect, it } from "vitest";
import {
  buildJoinApplicationPayload,
  designerApplicationFormSchema,
  EMPTY_JOIN_FORM,
  joinFormCategoryOptions,
  type JoinFormValues,
} from "@/lib/validation/designerApplicationForm";
import {
  designerApplicationBodySchema,
  parseYearFounded,
} from "@/lib/validation/designerApplicationBody";
import {
  getFoundingYearOptions,
  STUDIO_CURRENCIES_FOR_PRICE_SELECT,
} from "@/lib/brands/studioBrandFormConstants";
import { EXPLORE_PRICING_LABEL } from "@/lib/brands/joinApplicationPricing";

const PHOTO = "https://example.supabase.co/storage/v1/object/public/brand-assets/applications/a.jpg";

/** Only the required fields filled in; everything optional left as the form starts. */
const MINIMAL: JoinFormValues = {
  ...EMPTY_JOIN_FORM,
  brandName: "Bags by IWAH",
  designerName: "Iwah",
  email: "hello@bagsbyiwah.com",
  location: "Lagos, Nigeria",
  category: "Accessories",
  description: "Handmade leather bags.",
  priceMin: "20000",
  priceMax: "80000",
  currency: "NGN",
};

function fieldsWithErrors(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.success ? [] : result.error!.issues.map((i) => String(i.path[0]));
}

/** What the form would send, run through both checks the way the browser and server do. */
function submit(values: JoinFormValues, imageUrls: string[] = [PHOTO]) {
  const payload = buildJoinApplicationPayload(values, imageUrls);
  const client = designerApplicationFormSchema.safeParse(payload);
  const server = designerApplicationBodySchema.safeParse(JSON.parse(JSON.stringify(payload)));
  return { client, server };
}

function expectAccepted(values: JoinFormValues, imageUrls?: string[]) {
  const { client, server } = submit(values, imageUrls);
  expect(fieldsWithErrors(client), "form rejected it").toEqual([]);
  expect(fieldsWithErrors(server), "API rejected what the form allowed").toEqual([]);
  return server.success ? server.data : null;
}

describe("join form → API: optional fields", () => {
  const OPTIONAL: Partial<Record<keyof JoinFormValues, string>> = {
    phone: "+234 801 234 5678",
    website: "bagsbyiwah.com",
    instagram: "@bagsbyiwah",
    yearFounded: "2021",
  };
  const keys = Object.keys(OPTIONAL) as (keyof typeof OPTIONAL)[];

  // Every combination of optional fields blank or filled (16 cases).
  for (let mask = 0; mask < 1 << keys.length; mask++) {
    const filled = keys.filter((_, i) => mask & (1 << i));
    const label = filled.length ? `filled: ${filled.join(", ")}` : "all optional fields blank";
    it(`accepts an application with ${label}`, () => {
      const values = { ...MINIMAL };
      for (const k of filled) (values as Record<string, unknown>)[k] = OPTIONAL[k];
      const data = expectAccepted(values);
      for (const k of keys) {
        if (!filled.includes(k)) expect(data?.[k as keyof typeof data]).toBeNull();
      }
    });
  }

  it("accepts the shop with no website, no phone and no Instagram (the reported bug)", () => {
    const data = expectAccepted({ ...MINIMAL, website: "", phone: "", instagram: "" });
    expect(data?.website).toBeNull();
  });
});

describe("join form → API: every dropdown option", () => {
  it.each([...joinFormCategoryOptions])("accepts category %s", (category) => {
    expectAccepted({ ...MINIMAL, category });
  });

  it.each(STUDIO_CURRENCIES_FOR_PRICE_SELECT.map((c) => c.code))("accepts currency %s", (currency) => {
    const data = expectAccepted({ ...MINIMAL, currency });
    expect(data?.currency).toBe(currency);
  });

  it("accepts every founding year in the dropdown", () => {
    for (const yearFounded of getFoundingYearOptions()) {
      const data = expectAccepted({ ...MINIMAL, yearFounded });
      expect(parseYearFounded(data!.yearFounded)).toBe(Number(yearFounded));
    }
  });
});

describe("join form → API: pricing", () => {
  it("accepts contact-for-pricing with the price boxes empty", () => {
    const data = expectAccepted({ ...MINIMAL, contactForPricing: true, priceMin: "", priceMax: "" });
    expect(data?.priceRange).toBe(EXPLORE_PRICING_LABEL);
  });

  it("accepts contact-for-pricing even if old prices are left in the boxes", () => {
    expectAccepted({ ...MINIMAL, contactForPricing: true, priceMin: "10", priceMax: "5" });
  });

  it.each([
    ["decimals", "49.99", "149.50"],
    ["same min and max", "100", "100"],
    ["zero minimum", "0", "50"],
    ["large numbers", "250000", "1500000"],
  ])("accepts %s", (_label, priceMin, priceMax) => {
    const data = expectAccepted({ ...MINIMAL, priceMin, priceMax });
    expect(data?.priceRange).toBeTruthy();
  });

  it("asks for prices when neither prices nor contact-for-pricing are given", () => {
    const { client } = submit({ ...MINIMAL, priceMin: "", priceMax: "" });
    expect(fieldsWithErrors(client)).toContain("priceMin");
  });

  it("flags a maximum below the minimum on the form", () => {
    const { client } = submit({ ...MINIMAL, priceMin: "500", priceMax: "100" });
    expect(fieldsWithErrors(client)).toContain("priceMax");
  });
});

describe("join form → API: how people actually type", () => {
  it.each([
    ["website without https", { website: "www.bagsbyiwah.com" }],
    ["website with https and a path", { website: "https://bagsbyiwah.com/shop/" }],
    ["website with spaces around it", { website: "  bagsbyiwah.com  " }],
    ["Instagram with @", { instagram: "@bagsbyiwah" }],
    ["Instagram with @@", { instagram: "@@bagsbyiwah" }],
    ["Instagram without @", { instagram: "bagsbyiwah" }],
    ["accented names", { brandName: "Àsọ Òkè Studio", designerName: "Fáṣọlá Adébáyọ̀" }],
    ["emoji in the description", { description: "Handmade bags ✨👜 made in Lagos." }],
    ["a long description", { description: "Handmade. ".repeat(1500) }],
    ["email with capitals and spaces", { email: "  Hello@BagsByIwah.com " }],
    ["names with trailing spaces", { brandName: "Bags by IWAH ", designerName: " Iwah" }],
    ["phone with brackets and dashes", { phone: "(+44) 20-7946-0958" }],
  ])("accepts %s", (_label, overrides) => {
    expectAccepted({ ...MINIMAL, ...overrides } as JoinFormValues);
  });

  it.each([1, 2, 3])("accepts %i photo(s)", (n) => {
    expectAccepted(MINIMAL, Array.from({ length: n }, (_, i) => `${PHOTO}?n=${i}`));
  });

  it("stores Instagram with a single @", () => {
    const data = expectAccepted({ ...MINIMAL, instagram: "@@bagsbyiwah" });
    expect(data?.instagram).toBe("bagsbyiwah");
  });

  it("adds https:// to a bare website", () => {
    const data = expectAccepted({ ...MINIMAL, website: "bagsbyiwah.com" });
    expect(data?.website).toBe("https://bagsbyiwah.com/");
  });
});

describe("join form: required fields are caught before sending", () => {
  it.each(["brandName", "designerName", "email", "location", "category", "description"] as const)(
    "flags a blank %s on the form",
    (field) => {
      const { client } = submit({ ...MINIMAL, [field]: "   " });
      expect(fieldsWithErrors(client)).toContain(field);
    },
  );

  it("flags missing photos on the form", () => {
    const { client } = submit(MINIMAL, []);
    expect(fieldsWithErrors(client)).toContain("imageUrls");
  });

  it("flags a malformed email on the form", () => {
    const { client } = submit({ ...MINIMAL, email: "hello@bagsbyiwah" });
    expect(fieldsWithErrors(client)).toContain("email");
  });
});

describe("join form → API: random applications", () => {
  // Small seeded generator so failures are repeatable.
  function rng(seed: number) {
    return () => {
      seed = (seed * 1664525 + 1013904223) % 2 ** 32;
      return seed / 2 ** 32;
    };
  }

  it("never lets the form accept something the API would reject (2,000 cases)", () => {
    const rand = rng(42);
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
    const text = ["", " ", "a", "  padded  ", "Àṣẹ", "x".repeat(250), "@@handle", "https://x.co", "null", "0"];
    const prices = ["", "0", "10", "99.99", "-5", "abc", "1e3", " 50 ", "100000"];
    const years = ["", ...getFoundingYearOptions().slice(0, 5), "1899", "abcd"];
    const failures: string[] = [];

    for (let i = 0; i < 2000; i++) {
      const values: JoinFormValues = {
        brandName: pick(text),
        designerName: pick(text),
        email: pick(["", "a@b.co", " Mixed@Case.com ", "bad@", "x@y"]),
        phone: pick(text),
        website: pick(["", " ", "site.com", "https://site.com/a", "not a url", "http://"]),
        instagram: pick(text),
        location: pick(text),
        category: pick([...joinFormCategoryOptions, "", "Made Up"]),
        description: pick(text),
        yearFounded: pick(years),
        currency: pick([...STUDIO_CURRENCIES_FOR_PRICE_SELECT.map((c) => c.code), "", "XXX"]),
        priceMin: pick(prices),
        priceMax: pick(prices),
        contactForPricing: rand() < 0.3,
      };
      const photos = Array.from({ length: Math.floor(rand() * 4) }, (_, n) => `${PHOTO}?n=${n}`);
      const { client, server } = submit(values, photos);
      if (client.success && !server.success) {
        failures.push(`${JSON.stringify(values)} → API rejected: ${fieldsWithErrors(server).join(", ")}`);
      }
    }

    expect(failures.slice(0, 5)).toEqual([]);
  });
});
