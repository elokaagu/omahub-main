/** Custom orders and product requests: the bodies both order forms send must be accepted. */
import { describe, expect, it } from "vitest";
import { parseCustomOrderBody } from "@/lib/validation/customOrderBody";

const address = {
  full_name: "Shannon Iwah",
  email: "hello@bagsbyiwah.com",
  phone: "",
  address_line_1: "12 Admiralty Way",
  city: "Lagos",
  state: "Lagos",
  postal_code: "101233",
  country: "Nigeria",
};

/** Shape sent by components/ui/brand-request-modal.tsx */
function productRequest(price: number, overrides: Record<string, unknown> = {}) {
  return JSON.parse(
    JSON.stringify({
      product_id: "prod-1",
      brand_id: "brand-1",
      customer_notes: "",
      delivery_address: address,
      total_amount: price * 1,
      size: "",
      color: "",
      quantity: 1,
      ...overrides,
    }),
  );
}

/** Shape sent by components/product/TailoredOrderModal.tsx */
function tailoredOrder(price: number, overrides: Record<string, unknown> = {}) {
  return JSON.parse(
    JSON.stringify({
      user_id: "6f1c2a9e-8f3b-4c1d-9a7e-2b5c8d0e1f23",
      product_id: "prod-1",
      brand_id: "brand-1",
      customer_notes: "Please make the sleeves a little longer.",
      delivery_address: address,
      total_amount: price,
      size: "",
      color: "",
      quantity: 1,
      measurements: { fit_preference: "regular", length_preference: "regular", sleeve_preference: "long", chest: "92" },
      ...overrides,
    }),
  );
}

describe("custom order body", () => {
  it.each([0, 49.99, 1500])("accepts a product request at price %s", (price) => {
    expect(parseCustomOrderBody(productRequest(price)).success).toBe(true);
  });

  it.each([0, 49.99, 1500])("accepts a tailored order at price %s", (price) => {
    expect(parseCustomOrderBody(tailoredOrder(price)).success).toBe(true);
  });

  it("accepts a price-on-request product (price 0), which 16 live products use", () => {
    const r = parseCustomOrderBody(productRequest(0));
    expect(r.success).toBe(true);
  });

  it("accepts a price that could not be worked out (NaN becomes null over JSON)", () => {
    expect(parseCustomOrderBody(productRequest(Number.NaN)).success).toBe(true);
  });

  it("accepts null size, colour and measurements", () => {
    expect(
      parseCustomOrderBody(tailoredOrder(100, { size: null, color: null, measurements: { chest: null } })).success,
    ).toBe(true);
  });

  it("still rejects a negative price", () => {
    expect(parseCustomOrderBody(productRequest(-5)).success).toBe(false);
  });

  it("still requires a delivery address", () => {
    expect(parseCustomOrderBody(productRequest(10, { delivery_address: { ...address, city: "" } })).success).toBe(false);
  });
});
