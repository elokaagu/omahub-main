import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readPlatformVisibility } from "@/lib/studio/platformSettings";

function clientReturning(result: { data: unknown; error: unknown }) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => result }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("readPlatformVisibility", () => {
  it("is public only when the stored value is exactly 'public'", async () => {
    const v = await readPlatformVisibility(
      clientReturning({ data: { value: "public" }, error: null }),
    );
    expect(v).toMatchObject({ isPublic: true, status: "public" });
    expect(v.fallback).toBeUndefined();
  });

  it("treats a stored 'private' as private with no fallback note", async () => {
    const v = await readPlatformVisibility(
      clientReturning({ data: { value: "private" }, error: null }),
    );
    expect(v).toMatchObject({ isPublic: false, status: "private" });
    expect(v.fallback).toBeUndefined();
  });

  it("defaults a missing row to private and says so", async () => {
    const v = await readPlatformVisibility(
      clientReturning({ data: null, error: null }),
    );
    expect(v).toMatchObject({
      isPublic: false,
      settingPresent: false,
      fallback: "missing_row_defaults_to_private",
    });
  });

  it("treats an unrecognised value as private and says so", async () => {
    const v = await readPlatformVisibility(
      clientReturning({ data: { value: "yes" }, error: null }),
    );
    expect(v).toMatchObject({
      isPublic: false,
      fallback: "unrecognised_stored_value_treated_as_private",
    });
  });

  it("throws on a database error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      readPlatformVisibility(
        clientReturning({ data: null, error: { message: "boom" } }),
      ),
    ).rejects.toThrow();
  });
});
