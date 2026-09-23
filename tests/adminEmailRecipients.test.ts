import { beforeEach, describe, expect, it, vi } from "vitest";

/** Rows returned for the platform_settings lookup. */
let settingsRows: { key: string; value: string }[] = [];
/** Rows returned for the profiles lookup (super admin accounts). */
let profileRows: { email: string | null }[] = [];

vi.mock("@/lib/supabase-unified", () => ({
  createServerSupabaseClient: async () => ({
    from: () => ({
      select: () => ({
        in: async () => ({ data: settingsRows, error: null }),
      }),
    }),
  }),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getAdminClient: async () => ({
    from: () => ({
      select: () => ({
        eq: async () => ({ data: profileRows, error: null }),
      }),
    }),
  }),
}));

const { AdminEmailServiceServer } = await import(
  "@/lib/services/adminEmailService.server"
);

/** A fresh instance each time, since the service caches for 5 minutes. */
function service() {
  // @ts-expect-error -- the constructor is private by design
  return new AdminEmailServiceServer();
}

const SUPER_ADMINS = ["eloka.agu@icloud.com", "shannonalisa@oma-hub.com"];

beforeEach(() => {
  settingsRows = [
    { key: "super_admin_emails", value: JSON.stringify(SUPER_ADMINS) },
  ];
  profileRows = [];
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("super admin recipients", () => {
  it("uses the configured list", async () => {
    expect(await service().getSuperAdminEmails()).toEqual(SUPER_ADMINS);
  });

  it("falls back to the super admin accounts when nothing is configured", async () => {
    settingsRows = [];
    profileRows = SUPER_ADMINS.map((email) => ({ email }));
    expect(await service().getSuperAdminEmails()).toEqual(SUPER_ADMINS);
  });
});

describe("webhook (new account) recipients", () => {
  it("falls back to every super admin when the setting is missing", async () => {
    // This was the live bug: no webhook_admin_emails row, so nobody was told.
    expect(await service().getWebhookAdminEmails()).toEqual(SUPER_ADMINS);
  });

  it("still honours an explicit webhook list", async () => {
    settingsRows.push({
      key: "webhook_admin_emails",
      value: JSON.stringify(["ops@oma-hub.com"]),
    });
    expect(await service().getWebhookAdminEmails()).toEqual([
      "ops@oma-hub.com",
    ]);
  });

  it("ignores blank profile emails in the fallback", async () => {
    settingsRows = [];
    profileRows = [{ email: "shannonalisa@oma-hub.com" }, { email: null }];
    expect(await service().getWebhookAdminEmails()).toEqual([
      "shannonalisa@oma-hub.com",
    ]);
  });
});
