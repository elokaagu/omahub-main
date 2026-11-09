/**
 * Brand-owner (brand_admin) access rules enforced in app code.
 * Database-level rules are covered by scripts/security/rls-scenarios.
 */
import { describe, expect, it, vi } from "vitest";
import type { LeadsAdminContext } from "@/lib/auth/requireLeadsAdmin";
import {
  brandAdminOwnsBrand,
  sendsCommissionWithoutPermission,
} from "@/lib/services/adminLeadsAccess";
import {
  handlePostBooking,
  handlePutBooking,
} from "@/lib/services/adminLeadsHttpHandlers";

const owner = { role: "brand_admin", owned_brands: ["b1"] };
const superAdmin = { role: "super_admin", owned_brands: [] };

/** A supabase stand-in that fails the test if a commission request reaches it. */
function untouchableSupabase() {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("database should not be touched");
      },
    },
  ) as LeadsAdminContext["supabase"];
}

function ctx(profile: typeof owner): LeadsAdminContext {
  return {
    supabase: untouchableSupabase(),
    userId: "00000000-0000-0000-0000-00000000000b",
    profile,
  } as unknown as LeadsAdminContext;
}

const booking = {
  brand_id: "b1",
  customer_name: "Ada",
  customer_email: "ada@example.org",
  booking_type: "custom_order",
  status: "confirmed",
  booking_value: 1000,
  currency: "GBP",
};

describe("brand ownership", () => {
  it("brand owners own only their own brands", () => {
    expect(brandAdminOwnsBrand(owner as never, "b1")).toBe(true);
    expect(brandAdminOwnsBrand(owner as never, "b2")).toBe(false);
  });

  it("super admins can act on any brand", () => {
    expect(brandAdminOwnsBrand(superAdmin as never, "b2")).toBe(true);
  });
});

describe("commission is set by OmaHub only", () => {
  it.each([
    ["commission_rate", { commission_rate: 0 }],
    ["commission_amount", { commission_amount: 0 }],
  ])("brand owners can't send %s", (_f, extra) => {
    expect(sendsCommissionWithoutPermission(owner as never, extra)).toBe(true);
  });

  it("brand owners can send other booking fields", () => {
    expect(sendsCommissionWithoutPermission(owner as never, { status: "completed" })).toBe(false);
  });

  it("super admins can set commission", () => {
    expect(sendsCommissionWithoutPermission(superAdmin as never, { commission_rate: 5 })).toBe(false);
  });

  it("rejects a brand owner creating a booking with their own commission", async () => {
    const res = await handlePostBooking({ ...booking, commission_rate: 0.01 }, ctx(owner));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/commission/i);
  });

  it("rejects a brand owner changing commission on a booking", async () => {
    const res = await handlePutBooking(
      { id: "6f1c2a9e-8f3b-4c1d-9a7e-2b5c8d0e1f23", data: { commission_rate: 0 } },
      ctx(owner),
    );
    expect(res.status).toBe(403);
  });
});

describe("posting a review", () => {
  it("updates the brand rating and notifies the owner with server access, not the reviewer's login", async () => {
    const sessionWrites: string[] = [];
    const adminWrites: string[] = [];

    const sessionClient = {
      auth: { getUser: async () => ({ data: { user: { id: "u1", email: "u@x.co" } }, error: null }) },
      from: (table: string) => {
        const q: Record<string, unknown> = {};
        Object.assign(q, {
          select: () => q,
          eq: () => q,
          limit: () => q,
          maybeSingle: async () => ({ data: null, error: null }),
          insert: () => {
            sessionWrites.push(`insert:${table}`);
            return {
              select: () => ({
                single: async () => ({ data: { id: "r1", brand_id: "b1", rating: 5 }, error: null }),
              }),
            };
          },
          update: () => {
            sessionWrites.push(`update:${table}`);
            return { eq: async () => ({ error: null }) };
          },
        });
        return q;
      },
    };

    const adminClient = {
      from: (table: string) => {
        const q: Record<string, unknown> = {};
        Object.assign(q, {
          select: () => q,
          eq: () => (table === "reviews" ? Promise.resolve({ data: [{ rating: 5 }], error: null }) : q),
          maybeSingle: async () => ({ data: { user_id: "owner-1" }, error: null }),
          insert: () => {
            adminWrites.push(`insert:${table}`);
            return Promise.resolve({ error: null });
          },
          update: () => {
            adminWrites.push(`update:${table}`);
            return { eq: async () => ({ error: null }) };
          },
        });
        return q;
      },
    };

    vi.resetModules();
    vi.doMock("@/lib/supabase-unified", () => ({ createApiRouteSupabaseClient: () => sessionClient }));
    vi.doMock("@/lib/supabase-admin", () => ({ getAdminClient: async () => adminClient }));
    const { POST } = await import("@/app/api/reviews/route.js");

    const res = await POST(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: "b1", comment: "Beautiful work", rating: 5 }),
      }),
    );

    expect(res.status).toBe(200);
    expect(sessionWrites).toEqual(["insert:reviews"]);
    expect(adminWrites).toEqual(expect.arrayContaining(["insert:notifications", "update:brands"]));
  });
});
