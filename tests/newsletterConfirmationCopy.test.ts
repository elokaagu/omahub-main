import { describe, expect, it } from "vitest";
import {
  newsletterConfirmationCopy,
  type NewsletterConfirmationKind,
} from "@/lib/newsletter/confirmationCopy";

const KINDS: NewsletterConfirmationKind[] = ["new", "reactivation", "already"];

describe("newsletterConfirmationCopy", () => {
  it.each(KINDS)("gives %s a subject and a body", (kind) => {
    const copy = newsletterConfirmationCopy(kind);
    expect(copy.subject.length).toBeGreaterThan(0);
    expect(copy.welcome.length).toBeGreaterThan(0);
    expect(copy.detail.length).toBeGreaterThan(0);
  });

  it("tells a returning subscriber there is nothing to do", () => {
    // The whole point of the "already" variant: the form said "you're in",
    // so the email has to confirm it rather than imply a fresh signup.
    const copy = newsletterConfirmationCopy("already");
    expect(copy.subject).toMatch(/already/i);
    expect(copy.welcome).toMatch(/nothing you need to do/i);
    expect(copy.detail).toMatch(/keep getting/i);
  });

  it("does not greet a returning subscriber as a new one", () => {
    expect(newsletterConfirmationCopy("already").welcome).not.toMatch(
      /welcome/i
    );
  });

  it("welcomes the two that are actually joining", () => {
    expect(newsletterConfirmationCopy("new").welcome).toMatch(/welcome/i);
    expect(newsletterConfirmationCopy("reactivation").welcome).toMatch(
      /welcome back/i
    );
  });

  it("gives each kind a distinct subject", () => {
    const subjects = KINDS.map((k) => newsletterConfirmationCopy(k).subject);
    expect(new Set(subjects).size).toBe(KINDS.length);
  });

  it("carries no emoji", () => {
    const emoji =
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
    KINDS.forEach((kind) => {
      const copy = newsletterConfirmationCopy(kind);
      expect(`${copy.subject} ${copy.welcome} ${copy.detail}`).not.toMatch(
        emoji
      );
    });
  });
});
