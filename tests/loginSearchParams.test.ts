import { describe, expect, it } from "vitest";
import {
  getSafeRedirectPath,
  withQueryParam,
} from "@/app/login/loginSearchParams";

const params = (query: string) => new URLSearchParams(query);

describe("getSafeRedirectPath", () => {
  it("returns the requested in-app path, including its query", () => {
    expect(
      getSafeRedirectPath(params("redirect_to=%2Fstudio%2Feditions%3Ftab%3D2"))
    ).toBe("/studio/editions?tab=2");
  });

  it("accepts the legacy `redirect` key", () => {
    expect(getSafeRedirectPath(params("redirect=/studio"))).toBe("/studio");
  });

  it("defaults to the homepage when nothing is requested", () => {
    expect(getSafeRedirectPath(params(""))).toBe("/");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/studio%0a".replace("%0a", "\n"),
    "/login",
    "/login?redirect_to=/studio",
  ])("rejects unsafe or looping target %j", (target) => {
    expect(
      getSafeRedirectPath(params(`redirect_to=${encodeURIComponent(target)}`))
    ).toBe("/");
  });
});

describe("withQueryParam", () => {
  it("adds a param while keeping existing ones", () => {
    expect(withQueryParam("/studio?tab=2", "session_refresh", "true")).toBe(
      "/studio?tab=2&session_refresh=true"
    );
  });
});
