import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildOmaHubEmailHtml } from "@/lib/services/omahubEmailTemplate";

/** Pictographs and dingbats - the things that should never reach a recipient. */
const EMOJI =
  /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F0FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

const ROOT = join(__dirname, "..");

/** Every file that composes an email OmaHub sends. */
const EMAIL_SOURCES = [
  "lib/services/emailService.ts",
  "lib/services/newAccountAdminNotification.ts",
  "lib/services/contactSubmissionService.ts",
  "lib/services/omahubEmailTemplate.ts",
  "app/api/orders/custom/route.ts",
];

describe("OmaHub emails carry no emoji", () => {
  it.each(EMAIL_SOURCES)("%s has none in its subject lines", (file) => {
    const subjects = readFileSync(join(ROOT, file), "utf8")
      .split("\n")
      .filter((line) => /^\s*subject:/.test(line));

    subjects.forEach((line) => {
      expect(line, `emoji in subject: ${line.trim()}`).not.toMatch(EMOJI);
    });
  });

  it("renders a full email without one", () => {
    const html = buildOmaHubEmailHtml({
      title: "New designer application",
      subtitle: "Fitnoz by Dareven",
      intro: "A new designer application has been submitted.",
      sections: [
        {
          title: "Application details",
          details: [{ label: "Brand", value: "Fitnoz by Dareven" }],
        },
      ],
      ctaLabel: "Open Studio",
      ctaUrl: "https://oma-hub.com/studio",
    });

    expect(html).not.toMatch(EMOJI);
  });
});

describe("buildOmaHubEmailHtml", () => {
  const render = (over: Parameters<typeof buildOmaHubEmailHtml>[0]) =>
    buildOmaHubEmailHtml(over);

  it("leads with the wordmark and the headline", () => {
    const html = render({ title: "Application approved" });
    expect(html).toContain(">OmaHub<");
    expect(html).toContain("Application approved");
  });

  it("keeps its palette in dark-mode clients", () => {
    expect(render({ title: "x" })).toContain('name="color-scheme" content="light"');
  });

  it("escapes anything a submitter typed", () => {
    const html = render({
      title: "New application",
      intro: '<script>alert("x")</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("links a website, an email and a handle", () => {
    const html = render({
      title: "New application",
      sections: [
        {
          details: [
            { label: "Website", value: "https://myfitnoz.com/" },
            { label: "Email", value: "presse@myfitnoz.com" },
            { label: "Instagram", value: "@fitnozen" },
          ],
        },
      ],
    });

    expect(html).toContain('href="https://myfitnoz.com/"');
    expect(html).toContain('href="mailto:presse@myfitnoz.com"');
    expect(html).toContain('href="https://instagram.com/fitnozen"');
  });

  it("leaves an ordinary value as plain text", () => {
    const html = render({
      title: "New application",
      sections: [{ details: [{ label: "Location", value: "Bon Accueil" }] }],
    });
    expect(html).toContain("Bon Accueil");
    expect(html).not.toContain('href="mailto:Bon Accueil"');
  });

  it("omits the button when there is nowhere to send the reader", () => {
    expect(render({ title: "x", ctaLabel: "Open Studio" })).not.toContain(
      "Open Studio"
    );
  });
});
