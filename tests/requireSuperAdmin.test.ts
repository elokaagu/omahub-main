import { beforeEach, describe, expect, it, vi } from "vitest";

const state: {
  user: { id: string } | null;
  authError: unknown;
  profile: { role: string } | null;
  profileError: unknown;
} = { user: null, authError: null, profile: null, profileError: null };

vi.mock("@/lib/supabase-unified", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.user },
        error: state.authError,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: state.profile,
            error: state.profileError,
          }),
        }),
      }),
    }),
  }),
}));

const { requireSuperAdmin } = await import("@/lib/auth/requireSuperAdmin");

beforeEach(() => {
  state.user = { id: "u1" };
  state.authError = null;
  state.profile = { role: "super_admin" };
  state.profileError = null;
});

describe("requireSuperAdmin", () => {
  it("allows a super admin", async () => {
    const result = await requireSuperAdmin();
    expect(result).toMatchObject({ ok: true, userId: "u1" });
  });

  it("rejects signed-out requests with 401", async () => {
    state.user = null;
    expect(await requireSuperAdmin()).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects an invalid session with 401", async () => {
    state.authError = new Error("jwt expired");
    expect(await requireSuperAdmin()).toMatchObject({ ok: false, status: 401 });
  });

  it.each(["user", "brand_admin", "admin"])(
    "rejects role %s with 403",
    async (role) => {
      state.profile = { role };
      expect(await requireSuperAdmin()).toMatchObject({
        ok: false,
        status: 403,
      });
    }
  );

  it("fails closed when the profile lookup errors", async () => {
    state.profileError = new Error("db down");
    expect(await requireSuperAdmin()).toMatchObject({ ok: false, status: 403 });
  });

  it("fails closed when there is no profile row", async () => {
    state.profile = null;
    expect(await requireSuperAdmin()).toMatchObject({ ok: false, status: 403 });
  });
});
