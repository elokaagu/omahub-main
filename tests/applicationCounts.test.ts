import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { countStudioApplications } from "@/lib/studio/applicationCounts";

type CountResult = { count: number | null; error: { message: string } | null };

/** Fake client: first `select` is the total, the `.eq("status","new")` one is fresh. */
function fakeClient(total: CountResult, fresh: CountResult) {
  const select = vi.fn(() => {
    const query = Promise.resolve(total) as Promise<CountResult> & {
      eq: () => Promise<CountResult>;
    };
    query.eq = () => Promise.resolve(fresh);
    return query;
  });
  return {
    client: { from: () => ({ select }) } as unknown as SupabaseClient,
    select,
  };
}

describe("countStudioApplications", () => {
  it("returns total and new counts from head-only queries", async () => {
    const { client, select } = fakeClient(
      { count: 12, error: null },
      { count: 3, error: null },
    );
    expect(await countStudioApplications(client)).toEqual({ total: 12, new: 3 });
    expect(select).toHaveBeenCalledWith("id", { count: "exact", head: true });
  });

  it("returns null when either query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeClient(
      { count: 12, error: null },
      { count: null, error: { message: "boom" } },
    );
    expect(await countStudioApplications(client)).toBeNull();
  });
});
