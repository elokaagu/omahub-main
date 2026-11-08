/**
 * Public forms must never let someone submit something the server then rejects.
 * Each test renders the real form, submits it, captures the request body and
 * runs it through the API's own validation.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { z } from "zod";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { NewsletterSignupCard } from "@/app/contact/NewsletterSignupCard";
import { EmailCaptureForm } from "@/app/home/editorial/EmailCaptureForm";
import { ContactFormSection } from "@/app/contact/ContactFormSection";
import { getEmailValidationError, isValidEmailFormat } from "@/app/contact/contactValidation";
import {
  buildNewsletterSubscribePayload,
  isNewsletterHoneypotTriggered,
  newsletterSourceSchema,
  parseNewsletterSubscribeBody,
} from "@/lib/validation/newsletterSubscribeBody";
import { parseContactPostBody } from "@/lib/validation/contactPostBody";
import { eventWaitlistPostBodySchema } from "@/lib/validation/eventWaitlistPostBody";

let sent: { url: string; body: unknown }[] = [];

beforeEach(() => {
  sent = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      sent.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null });
      return new Response(JSON.stringify({ success: true, message: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function type(el: HTMLElement, value: string) {
  fireEvent.change(el, { target: { value } });
}

async function lastRequestTo(path: string) {
  await waitFor(() => expect(sent.some((r) => r.url.includes(path))).toBe(true));
  return sent.filter((r) => r.url.includes(path)).at(-1)!.body;
}

describe("Contact page newsletter card", () => {
  it.each([
    ["email only", "", ""],
    ["email and names", "Shannon", "Iwah"],
  ])("sends a signup the server accepts (%s)", async (_label, first, last) => {
    render(<NewsletterSignupCard />);
    type(screen.getByPlaceholderText("First name"), first);
    type(screen.getByPlaceholderText("Last name"), last);
    type(screen.getByPlaceholderText("Enter your email"), "  hello@bagsbyiwah.com ");
    fireEvent.submit(screen.getByPlaceholderText("Enter your email").closest("form")!);

    const body = await lastRequestTo("/api/newsletter/subscribe");
    const parsed = parseNewsletterSubscribeBody(body);
    expect(parsed.success, JSON.stringify(body)).toBe(true);
    expect(parsed.data?.source).toBe("contact_page");
    expect(isNewsletterHoneypotTriggered(body)).toBe(false);
  });
});

describe("Homepage / editions email capture", () => {
  it.each(newsletterSourceSchema.options)("sends a signup the server accepts (source %s)", async (source) => {
    render(<EmailCaptureForm source={source} />);
    const input = screen.getByLabelText("Email address");
    type(input, "hello@bagsbyiwah.com");
    fireEvent.submit(input.closest("form")!);

    const body = await lastRequestTo("/api/newsletter/subscribe");
    const parsed = parseNewsletterSubscribeBody(body);
    expect(parsed.success, JSON.stringify(body)).toBe(true);
    expect(parsed.data?.source).toBe(source);
    expect(isNewsletterHoneypotTriggered(body)).toBe(false);
  });
});

describe("Newsletter API: tolerant of older or odd requests", () => {
  it("accepts null names (sent by older cached pages)", () => {
    const r = parseNewsletterSubscribeBody({ email: "a@b.co", firstName: null, lastName: null, source: "website" });
    expect(r.success).toBe(true);
  });

  it("records an unknown source as 'other' instead of rejecting the signup", () => {
    const r = parseNewsletterSubscribeBody({ email: "a@b.co", source: "contact_form" });
    expect(r.success).toBe(true);
    expect(r.data?.source).toBe("other");
  });

  it("defaults the source to 'website' when none is given", () => {
    const r = parseNewsletterSubscribeBody({ email: "a@b.co" });
    expect(r.data?.source).toBe("website");
  });

  it("payload builder drops blank names and trims email", () => {
    expect(
      buildNewsletterSubscribePayload({ email: " a@b.co ", firstName: "  ", lastName: "", source: "footer" }),
    ).toEqual({ email: "a@b.co", firstName: undefined, lastName: undefined, source: "footer", _newsletter_hp: "" });
  });
});

describe("Contact form", () => {
  it("sends a message the server accepts", async () => {
    const { container } = render(<ContactFormSection />);
    const field = (name: string) => container.querySelector(`[name="${name}"]`) as HTMLElement;
    type(field("name"), "Shannon");
    type(field("email"), " hello@bagsbyiwah.com ");
    type(field("subject"), "Join application");
    type(field("message"), "I couldn't submit my application yesterday.");
    fireEvent.submit(field("message").closest("form")!);

    const body = await lastRequestTo("/api/contact");
    const parsed = parseContactPostBody(body);
    expect(parsed.ok, JSON.stringify(body)).toBe(true);
  });

  it("stops a too-short message before sending", async () => {
    const { container } = render(<ContactFormSection />);
    const field = (name: string) => container.querySelector(`[name="${name}"]`) as HTMLElement;
    type(field("name"), "Shannon");
    type(field("email"), "hello@bagsbyiwah.com");
    type(field("subject"), "Hi");
    type(field("message"), "short");
    fireEvent.submit(field("message").closest("form")!);
    await new Promise((r) => setTimeout(r, 20));
    expect(sent.filter((r) => r.url.includes("/api/contact"))).toHaveLength(0);
  });
});

describe("Email check matches the server", () => {
  const serverEmail = z.string().trim().email();
  const emails = [
    "a@b.co", "A@X.COM", "a+tag@x.com", "a_b@x.io", "first.last@x.co.uk", "  padded@x.com ",
    "name@sub.domain-with-dash.ng", "1@x.museum", "a'b@x.com",
    // common typos and edge cases
    "a@b.c", "a..b@x.com", "a.@x.com", ".a@x.com", "a@x..com", "a@x.com.", "a@-x.com",
    "josé@example.com", "a@[1.2.3.4]", "a#b@x.com", "no-at-sign.com", "a@b", "@x.com", "a@",
  ];

  it.each(emails)("form and server agree on %s", (email) => {
    const server = serverEmail.safeParse(email).success;
    expect(isValidEmailFormat(email)).toBe(server);
    expect(getEmailValidationError(email) === null).toBe(server);
  });
});

describe("Preorder waitlist API accepts what the form sends", () => {
  // Mirrors the body built in EventWaitlistForm (optional fields become undefined when blank).
  const base = {
    name: "Shannon",
    email: "hello@bagsbyiwah.com",
    requestedBrand: "Bags by IWAH",
    itemDescription: "Mini tote in tan",
    size: "One size",
  };

  it.each([
    ["required fields only", {}],
    ["all optional fields", { phone: "+234 801", colour: "Tan", additionalNotes: "Gift wrap please" }],
    ["designer not on OmaHub", { requestedBrand: "[Not on OmaHub] Some Label" }],
    ["piece not in catalogue", { itemDescription: "[Not in catalogue] Custom clutch" }],
  ])("%s", (_label, extra) => {
    const body = JSON.parse(JSON.stringify({ ...base, phone: undefined, colour: undefined, additionalNotes: undefined, ...extra }));
    expect(eventWaitlistPostBodySchema.safeParse(body).success).toBe(true);
  });
});
