import { matchesAllTerms, sortByRelevance } from "./searchQuery";
import type { SearchHit } from "./types";

type SitePage = SearchHit & { type: "page"; keywords: string };

/** Static site pages that can be found by search (and shown as quick links). */
export const SITE_PAGES: SitePage[] = [
  {
    id: "page-directory",
    type: "page",
    title: "Explore Designers",
    subtitle: "The full OmaHub designer directory",
    url: "/directory",
    keywords: "brands directory designers browse all",
  },
  {
    id: "page-editions",
    type: "page",
    title: "Experiences",
    subtitle: "Past and upcoming OmaHub editions",
    url: "/editions",
    keywords: "events pop-up shows archive editions experiences",
  },
  {
    id: "page-how-it-works",
    type: "page",
    title: "How It Works",
    subtitle: "How OmaHub connects you with designers",
    url: "/how-it-works",
    keywords: "help guide process",
  },
  {
    id: "page-tailored",
    type: "page",
    title: "Custom Tailoring",
    subtitle: "Made-to-measure pieces from our tailors",
    url: "/tailored",
    keywords: "tailors bespoke made to measure fit",
  },
  {
    id: "page-about",
    type: "page",
    title: "Our Story",
    subtitle: "About OmaHub",
    url: "/about",
    keywords: "about mission team",
  },
  {
    id: "page-join",
    type: "page",
    title: "Join the Hub",
    subtitle: "Apply to join OmaHub as a designer",
    url: "/join",
    keywords: "apply designer application sign up brand",
  },
  {
    id: "page-events",
    type: "page",
    title: "Events",
    subtitle: "Join the waitlist for the next edition",
    url: "/event-waitlist",
    keywords: "waitlist next edition tickets",
  },
  {
    id: "page-faq",
    type: "page",
    title: "FAQs",
    subtitle: "Answers to common questions",
    url: "/faq",
    keywords: "questions help support",
  },
  {
    id: "page-contact",
    type: "page",
    title: "Contact Us",
    subtitle: "Get in touch with the OmaHub team",
    url: "/contact",
    keywords: "email support help",
  },
];

/** Pages shown before anything is typed. */
export const QUICK_LINK_IDS = [
  "page-directory",
  "page-editions",
  "page-tailored",
  "page-join",
];

export function searchSitePages(query: string, limit = 4): SearchHit[] {
  const matches = SITE_PAGES.filter((page) =>
    matchesAllTerms(`${page.title} ${page.subtitle} ${page.keywords}`, query),
  );
  return sortByRelevance(matches, query, (page) => page.title)
    .slice(0, limit)
    .map(({ keywords: _keywords, ...hit }) => hit);
}
