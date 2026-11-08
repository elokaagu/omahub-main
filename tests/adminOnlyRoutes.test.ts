/**
 * One-off maintenance endpoints must refuse anyone who isn't a super admin,
 * and must not touch the database when they do.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createTable: vi.fn(async () => ({ success: true })),
  from: vi.fn(),
}));

vi.mock("@/lib/auth/requireSuperAdmin", () => ({ requireSuperAdmin: mocks.auth }));
vi.mock("@/lib/supabase-admin", () => ({ createProductsTable: mocks.createTable }));
vi.mock("@/lib/supabase", () => ({ supabase: { from: mocks.from } }));

import { GET as setupDatabase } from "@/app/api/setup-database/route";
import { GET as migrateImages } from "@/app/api/migrate-images/route";
import { NextRequest } from "next/server";

beforeEach(() => vi.clearAllMocks());

describe.each([
  ["setup-database", () => setupDatabase()],
  ["migrate-images", () => migrateImages(new NextRequest("http://localhost/api/migrate-images"))],
])("/api/%s", (_name, call) => {
  it("refuses signed-out visitors without touching the database", async () => {
    mocks.auth.mockResolvedValue({ ok: false, status: 401, error: "Not authenticated" });
    const res = await call();
    expect(res.status).toBe(401);
    expect(mocks.createTable).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("refuses signed-in users who aren't super admins", async () => {
    mocks.auth.mockResolvedValue({ ok: false, status: 403, error: "Forbidden" });
    const res = await call();
    expect(res.status).toBe(403);
    expect(mocks.createTable).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
