import { describe, expect, it } from "vitest";
import {
  buildUsersCsv,
  escapeCsvField,
  usersCsvFilename,
} from "@/app/studio/users/usersCsv";

describe("escapeCsvField", () => {
  it("leaves plain values alone", () => {
    expect(escapeCsvField("ada@example.com")).toBe("ada@example.com");
  });

  it("quotes values with commas, quotes or newlines", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("line\nbreak")).toBe('"line\nbreak"');
  });
});

describe("buildUsersCsv", () => {
  it("writes a header and one CRLF-separated row per user", () => {
    const csv = buildUsersCsv([
      {
        id: "u1",
        email: "ada@example.com",
        role: "brand_admin",
        owned_brands: ["b1", "b2"],
        brand_names: ["Aso, Ebi", "Kente"],
        created_at: "2026-01-02T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      },
    ]);
    expect(csv.split("\r\n")).toEqual([
      "email,role,brands,created_at,user_id",
      'ada@example.com,brand_admin,"Aso, Ebi; Kente",2026-01-02T00:00:00Z,u1',
    ]);
  });
});

describe("usersCsvFilename", () => {
  const date = new Date("2026-09-22T10:00:00Z");

  it("names unfiltered exports", () => {
    expect(usersCsvFilename("all", "", date)).toBe(
      "omahub-users-all-roles-2026-09-22.csv",
    );
  });

  it("includes the role and a safe search slug", () => {
    expect(usersCsvFilename("brand_admin", "ada @x", date)).toBe(
      "omahub-users-brand-admin-search-ada-x-2026-09-22.csv",
    );
  });
});
