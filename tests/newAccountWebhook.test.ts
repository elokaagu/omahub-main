/**
 * /api/webhooks/new-account receives Supabase Database Webhook calls when a
 * profile is created, and emails admins. These tests send the exact body
 * Supabase sends (see docs/new-account-notifications.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const notify = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/services/newAccountAdminNotification", () => ({
  notifyAdminsOfNewProfile: notify,
}));

import { POST } from "@/app/api/webhooks/new-account/route";

// Fake value for tests only.
const SECRET = "not-a-real-secret";

/** Body shape of a Supabase Database Webhook for an INSERT. */
function supabaseInsert(table = "profiles", type = "INSERT") {
  return {
    type,
    table,
    schema: "public",
    record: {
      id: "6f1c2a9e-8f3b-4c1d-9a7e-2b5c8d0e1f23",
      email: "newuser@gmail.com",
      role: "user",
      created_at: "2026-11-08T18:30:00.000Z",
    },
    old_record: null,
  };
}

function call(body: unknown, auth?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = auth;
  return POST(
    new NextRequest("http://localhost/api/webhooks/new-account", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  notify.mockClear();
  vi.stubEnv("WEBHOOK_SECRET", SECRET);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/webhooks/new-account", () => {
  it("emails admins for a new profile sent by Supabase", async () => {
    const res = await call(supabaseInsert(), `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(notify).toHaveBeenCalledWith({
      id: "6f1c2a9e-8f3b-4c1d-9a7e-2b5c8d0e1f23",
      email: "newuser@gmail.com",
      role: "user",
      created_at: "2026-11-08T18:30:00.000Z",
    });
  });

  it("rejects a wrong secret", async () => {
    const res = await call(supabaseInsert(), "Bearer not-the-secret");
    expect(res.status).toBe(401);
    expect(notify).not.toHaveBeenCalled();
  });

  it("rejects a missing secret", async () => {
    const res = await call(supabaseInsert());
    expect(res.status).toBe(401);
    expect(notify).not.toHaveBeenCalled();
  });

  it("is switched off (503) until WEBHOOK_SECRET is set", async () => {
    vi.stubEnv("WEBHOOK_SECRET", "");
    const res = await call(supabaseInsert(), `Bearer ${SECRET}`);
    expect(res.status).toBe(503);
    expect(notify).not.toHaveBeenCalled();
  });

  it.each([
    ["an UPDATE", supabaseInsert("profiles", "UPDATE")],
    ["another table", supabaseInsert("brands")],
  ])("ignores %s without emailing", async (_label, body) => {
    const res = await call(body, `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(notify).not.toHaveBeenCalled();
  });
});
