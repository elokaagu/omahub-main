import { describe, expect, it } from "vitest";
import {
  ALL_CATEGORIES,
  ALL_LOCATIONS,
  PAGE_SIZE,
  activeFilterChips,
  directoryHref,
  filterDirectoryBrands,
  parseDirectoryQuery,
  sortDirectoryBrands,
  type DirectoryBrand,
} from "@/app/directory/directoryQuery";

const brand = (over: Partial<DirectoryBrand> = {}): DirectoryBrand => ({
  id: "1",
  name: "Aso Couture",
  image: "/a.jpg",
  category: "Bridal",
  categories: [],
  location: "Lagos",
  isVerified: false,
  ...over,
});

describe("parseDirectoryQuery", () => {
  it("defaults to everything, featured first, grid view", () => {
    expect(parseDirectoryQuery({})).toEqual({
      q: "",
      category: ALL_CATEGORIES,
      location: ALL_LOCATIONS,
      sort: "featured",
      view: "grid",
      limit: PAGE_SIZE,
    });
  });

  it("reads filters from the URL", () => {
    expect(
      parseDirectoryQuery({
        q: "kente",
        category: "Bridal",
        location: "Accra",
        sort: "rating",
        view: "list",
        limit: "48",
      }),
    ).toMatchObject({
      q: "kente",
      category: "Bridal",
      location: "Accra",
      sort: "rating",
      view: "list",
      limit: 48,
    });
  });

  it("ignores unknown sort values and silly limits", () => {
    expect(parseDirectoryQuery({ sort: "cheapest" }).sort).toBe("featured");
    expect(parseDirectoryQuery({ limit: "-5" }).limit).toBe(PAGE_SIZE);
    expect(parseDirectoryQuery({ limit: "99999" }).limit).toBe(500);
  });

  it("still honours legacy occasion and subcategory links", () => {
    expect(parseDirectoryQuery({ subcategory: "Evening+Gowns" }).category).toBe(
      "Evening Gowns",
    );
    expect(parseDirectoryQuery({ occasion: "wedding" }).category).toBeTruthy();
  });
});

describe("directoryHref", () => {
  const base = parseDirectoryQuery({});

  it("leaves defaults out of the URL", () => {
    expect(directoryHref(base, {})).toBe("/directory");
  });

  it("writes only what differs from the default", () => {
    expect(directoryHref(base, { category: "Bridal", view: "list" })).toBe(
      "/directory?category=Bridal&view=list",
    );
  });

  it("keeps existing filters when one changes", () => {
    const withCity = parseDirectoryQuery({ location: "Accra" });
    expect(directoryHref(withCity, { q: "lace" })).toBe(
      "/directory?q=lace&location=Accra",
    );
  });
});

describe("filterDirectoryBrands", () => {
  const brands = [
    brand({ id: "1", name: "Aso Couture", category: "Bridal", location: "Lagos" }),
    brand({ id: "2", name: "Kente House", category: "Accessories", location: "Accra" }),
  ];

  it("matches name, category or city", () => {
    const only = (q: string) =>
      filterDirectoryBrands(brands, {
        q,
        category: ALL_CATEGORIES,
        location: ALL_LOCATIONS,
      }).map((b) => b.id);
    expect(only("kente")).toEqual(["2"]);
    expect(only("lagos")).toEqual(["1"]);
    expect(only("accessories")).toEqual(["2"]);
  });

  it("filters by city", () => {
    expect(
      filterDirectoryBrands(brands, {
        q: "",
        category: ALL_CATEGORIES,
        location: "Accra",
      }).map((b) => b.id),
    ).toEqual(["2"]);
  });

  it("matches a brand's secondary categories too", () => {
    const multi = [brand({ id: "3", category: "Other", categories: ["Bridal"] })];
    expect(
      filterDirectoryBrands(multi, {
        q: "",
        category: "Bridal",
        location: ALL_LOCATIONS,
      }),
    ).toHaveLength(1);
  });
});

describe("sortDirectoryBrands", () => {
  const brands = [
    brand({ id: "1", name: "Zara Atelier", isVerified: false, rating: 4.9 }),
    brand({ id: "2", name: "Bloom", isVerified: true, rating: 3.1 }),
    brand({ id: "3", name: "Aso", isVerified: false, rating: 4.9 }),
  ];

  it("puts verified designers first, then alphabetical", () => {
    expect(sortDirectoryBrands(brands, "featured").map((b) => b.id)).toEqual([
      "2",
      "3",
      "1",
    ]);
  });

  it("sorts by name", () => {
    expect(sortDirectoryBrands(brands, "name").map((b) => b.id)).toEqual([
      "3",
      "2",
      "1",
    ]);
  });

  it("sorts by rating, breaking ties by name", () => {
    expect(sortDirectoryBrands(brands, "rating").map((b) => b.id)).toEqual([
      "3",
      "1",
      "2",
    ]);
  });

  it("does not mutate the input", () => {
    const input = [...brands];
    sortDirectoryBrands(input, "name");
    expect(input.map((b) => b.id)).toEqual(["1", "2", "3"]);
  });
});

describe("activeFilterChips", () => {
  it("has nothing to clear by default", () => {
    expect(activeFilterChips(parseDirectoryQuery({}))).toEqual([]);
  });

  it("offers one chip per active filter", () => {
    const chips = activeFilterChips(
      parseDirectoryQuery({ q: "lace", category: "Bridal", location: "Accra" }),
    );
    expect(chips.map((chip) => chip.label)).toEqual([
      "“lace”",
      "Bridal",
      "Accra",
    ]);
    expect(chips[1].clear).toEqual({ category: ALL_CATEGORIES });
  });
});
