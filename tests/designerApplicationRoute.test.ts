/**
 * End-to-end checks of the /join API routes with the database and email mocked:
 * a normal application gets saved and the applicant gets a success response.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  buildJoinApplicationPayload,
  EMPTY_JOIN_FORM,
  type JoinFormValues,
} from "@/lib/validation/designerApplicationForm";

const mocks = vi.hoisted(() => ({
  inserted: [] as Record<string, unknown>[],
  insertError: null as null | { code: string; message: string },
  recent: null as null | { id: string },
  uploads: [] as { path: string; contentType: string }[],
  uploadError: null as null | { message: string },
  confirmation: vi.fn(async () => ({ success: true })),
  notify: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getAdminClient: async () => ({
    from: () => {
      const q: Record<string, unknown> = {};
      Object.assign(q, {
        select: () => q,
        eq: () => q,
        gte: () => q,
        limit: () => q,
        maybeSingle: async () => ({ data: mocks.recent, error: null }),
        insert: (row: Record<string, unknown>) => {
          mocks.inserted.push(row);
          return {
            select: () => ({
              single: async () =>
                mocks.insertError
                  ? { data: null, error: mocks.insertError }
                  : { data: { id: "app-123" }, error: null },
            }),
          };
        },
      });
      return q;
    },
    storage: {
      from: () => ({
        upload: async (path: string, _b: unknown, opts: { contentType: string }) => {
          mocks.uploads.push({ path, contentType: opts.contentType });
          return { error: mocks.uploadError };
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }),
      }),
    },
  }),
}));
vi.mock("@/lib/services/emailService", () => ({
  sendApplicationConfirmationEmail: mocks.confirmation,
  sendNewApplicationNotification: mocks.notify,
}));
vi.mock("@/lib/services/adminEmailService.server", () => ({
  adminEmailServiceServer: { getSuperAdminEmails: async () => ["admin@oma-hub.com"] },
}));
// Rate limiting has its own behaviour; keep it out of the way here.
vi.mock("@/lib/rate-limit/designerApplicationRateLimit", () => ({
  checkDesignerApplicationRateLimit: () => true,
  getDesignerApplicationClientKey: () => "test",
}));
vi.mock("@/lib/rate-limit/designerApplicationImageUploadRateLimit", () => ({
  checkDesignerApplicationImageUploadRateLimit: () => true,
}));

import { POST as submitApplication } from "@/app/api/designer-application/route";
import { POST as uploadImage } from "@/app/api/designer-application/upload-image/route";

const FORM: JoinFormValues = {
  ...EMPTY_JOIN_FORM,
  brandName: "Bags by IWAH",
  designerName: "Iwah",
  email: "hello@bagsbyiwah.com",
  location: "Lagos, Nigeria",
  category: "Accessories",
  description: "Handmade leather bags.",
  currency: "NGN",
  priceMin: "20000",
  priceMax: "80000",
};

function post(body: unknown) {
  return submitApplication(
    new NextRequest("http://localhost/api/designer-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  mocks.inserted = [];
  mocks.insertError = null;
  mocks.recent = null;
  mocks.uploads = [];
  mocks.uploadError = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/designer-application", () => {
  it("saves an application with only the required fields filled in", async () => {
    const res = await post(buildJoinApplicationPayload(FORM, ["https://cdn.example/a.jpg"]));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ success: true, id: "app-123" });
    expect(mocks.inserted).toHaveLength(1);
    expect(mocks.inserted[0]).toMatchObject({
      brand_name: "Bags by IWAH",
      email: "hello@bagsbyiwah.com",
      website: null,
      phone: null,
      instagram: null,
      year_founded: null,
      currency: "NGN",
      image_urls: ["https://cdn.example/a.jpg"],
      status: "new",
    });
    expect(mocks.confirmation).toHaveBeenCalledOnce();
  });

  it("saves a fully filled-in application", async () => {
    const res = await post(
      buildJoinApplicationPayload(
        { ...FORM, website: "bagsbyiwah.com", instagram: "@bagsbyiwah", phone: "+234 801", yearFounded: "2021" },
        ["https://cdn.example/a.jpg", "https://cdn.example/b.jpg", "https://cdn.example/c.jpg"],
      ),
    );
    expect(res.status).toBe(200);
    expect(mocks.inserted[0]).toMatchObject({
      website: "https://bagsbyiwah.com/",
      instagram: "@bagsbyiwah",
      year_founded: 2021,
    });
  });

  it("names the problem field instead of a vague error", async () => {
    const res = await post(buildJoinApplicationPayload({ ...FORM, website: "not a url at all" }, ["https://cdn.example/a.jpg"]));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("Website");
    expect(json.fieldErrors).toHaveProperty("website");
    expect(mocks.inserted).toHaveLength(0);
  });

  it("names missing photos", async () => {
    const res = await post(buildJoinApplicationPayload(FORM, []));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain("Photos");
  });

  it("returns a readable message for a broken request", async () => {
    const res = await post("{not json");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });

  it("still succeeds if the confirmation email fails", async () => {
    mocks.confirmation.mockRejectedValueOnce(new Error("email down"));
    const res = await post(buildJoinApplicationPayload(FORM, ["https://cdn.example/a.jpg"]));
    expect(res.status).toBe(200);
  });

  it("tells the applicant to try again if saving fails", async () => {
    mocks.insertError = { code: "PGRST204", message: "column missing" };
    const res = await post(buildJoinApplicationPayload(FORM, ["https://cdn.example/a.jpg"]));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/try again/i);
  });

  it("explains a duplicate submission from the same email", async () => {
    mocks.recent = { id: "earlier" };
    const res = await post(buildJoinApplicationPayload(FORM, ["https://cdn.example/a.jpg"]));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/recently received/i);
  });
});

describe("POST /api/designer-application/upload-image", () => {
  function upload(type: string, bytes = 1024, name = "photo") {
    const body = new FormData();
    body.append("file", new File([new Uint8Array(bytes)], name, { type }));
    return uploadImage(
      new NextRequest("http://localhost/api/designer-application/upload-image", { method: "POST", body }),
    );
  }

  it.each(["image/jpeg", "image/jpg", "image/png", "image/webp", "IMAGE/JPEG"])("accepts %s", async (type) => {
    const res = await upload(type);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.url).toMatch(/^https:\/\/cdn\.example\/applications\//);
  });

  it("stores image/jpg uploads as image/jpeg", async () => {
    await upload("image/jpg");
    expect(mocks.uploads[0].contentType).toBe("image/jpeg");
  });

  it.each(["image/heic", "application/pdf", ""])("rejects %s with a clear message", async (type) => {
    const res = await upload(type);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/JPEG, PNG, or WebP/);
  });

  it("rejects files over 8MB with a clear message", async () => {
    const res = await upload("image/jpeg", 8 * 1024 * 1024 + 1);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/8MB/);
  });

  it("returns an error if storage fails", async () => {
    mocks.uploadError = { message: "bucket missing" };
    const res = await upload("image/jpeg");
    expect(res.status).toBe(500);
  });
});
