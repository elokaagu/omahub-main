/**
 * Which of the three ways someone can arrive at the newsletter list.
 *
 * "already" matters: the signup form tells a returning subscriber "you're
 * in", so staying silent breaks that promise. The on-screen response is the
 * same generic message for all three, because saying "you are already
 * subscribed" there would let anyone test whether an address is on the list.
 */
export type NewsletterConfirmationKind = "new" | "reactivation" | "already";

export type NewsletterConfirmationCopy = {
  subject: string;
  /** Opening line under the greeting. */
  welcome: string;
  /** What happens next. */
  detail: string;
};

const COPY: Record<NewsletterConfirmationKind, NewsletterConfirmationCopy> = {
  new: {
    subject: "Welcome to the OmaHub list",
    welcome: "Welcome to our community. We're glad to have you.",
    detail:
      "You'll get product drops, designer highlights and first word on the next edition.",
  },
  reactivation: {
    subject: "Welcome back to the OmaHub list",
    welcome: "Welcome back. We're glad to have you with us again.",
    detail:
      "You'll get product drops, designer highlights and first word on the next edition.",
  },
  already: {
    subject: "You're already on the OmaHub list",
    welcome:
      "You signed up again just now, and you were already on the list - so there is nothing you need to do.",
    detail:
      "You'll keep getting product drops, designer highlights and first word on the next edition.",
  },
};

export function newsletterConfirmationCopy(
  kind: NewsletterConfirmationKind
): NewsletterConfirmationCopy {
  return COPY[kind];
}
