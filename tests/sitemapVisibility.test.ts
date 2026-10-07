import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  visible: vi.fn(),
  from: vi.fn(),
  admin: vi.fn(),
}));

vi.mock("@/lib/supabase-unified", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/lib/services/catalogueVisibilitySetting", () => ({
  getCataloguesPubliclyVisible: mocks.visible,
}));
vi.mock("@/lib/data/editions", () => ({ getAllEditions: () => [] }));
vi.mock("@/lib/seo", () => ({ getSiteUrl: () => "https://www.oma-hub.com" }));

import { GET } from "@/app/sitemap.xml/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.admin.mockReturnValue({ from: mocks.from });
  mocks.from.mockImplementation((table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      order: () => Promise.resolve({
        data: [{ id: `${table}-id`, updated_at: "2026-10-01T00:00:00Z" }],
        error: null,
      }),
    };
    return query;
  });
});

describe("sitemap catalogue visibility", () => {
  it("omits hidden products and collections without querying their records", async () => {
    mocks.visible.mockResolvedValue(false);
    const response = await GET();
    const xml = await response.text();
    expect(response.status).toBe(200);
    expect(xml).not.toContain("/product/");
    expect(xml).not.toContain("/collection/");
    expect(xml).toContain("/brand/brands-id");
    expect(xml).toContain("/tailor/tailors-id");
    expect(xml).toContain("<loc>https://www.oma-hub.com/collections</loc>");
    expect(mocks.from.mock.calls.map(([table]) => table)).toEqual(["brands", "tailors"]);
  });

  it("restores product and collection entries when catalogues are public", async () => {
    mocks.visible.mockResolvedValue(true);
    const xml = await (await GET()).text();
    expect(xml).toContain("/product/products-id");
    expect(xml).toContain("/collection/catalogues-id");
    expect(xml).toContain("/brand/brands-id");
  });

  it("fails closed to static pages if visibility cannot be read", async () => {
    mocks.visible.mockRejectedValue(new Error("Visibility unavailable"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET();
    const xml = await response.text();
    expect(response.status).toBe(200);
    expect(xml).not.toContain("/product/");
    expect(xml).not.toContain("/collection/");
    expect(mocks.from).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
