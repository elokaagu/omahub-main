/**
 * OmaHub editions — the editorial archive that drives the magazine-model
 * homepage. Newest edition first. After every event, add the new edition to
 * the top with its recap video, story, and brand lineup.
 *
 * Brand lineups are matched against the brands table by name (case
 * insensitive), so entries here must match the brand's directory name.
 */

export type EditionStatus = "past" | "upcoming";

export interface Edition {
  slug: string;
  number: string;
  title: string;
  /** Short label used on archive cards, e.g. "Unboxed —\nThe Body Edition" */
  cardTitle: string;
  status: EditionStatus;
  /** Display date, e.g. "December 2025" */
  dateLabel: string;
  /** ISO date used only for ordering the archive */
  sortDate: string;
  city: string;
  country: string;
  venue?: string;
  partner?: string;
  /** e.g. "6 designers" or "8 brands" */
  lineupLabel?: string;
  /** One-liner for archive cards */
  excerpt: string;
  /** Longer story for the edition page */
  story: string;
  videoUrl?: string;
  videoThumbnail?: string;
  coverImage?: string;
  /** Directory names of brands that showed at this edition */
  brandNames: string[];
  applicationsOpen?: boolean;
  themeAnnounced?: boolean;
}

export const editions: Edition[] = [
  {
    slug: "edition-03",
    number: "03",
    title: "Edition 03",
    cardTitle: "Edition 03",
    status: "upcoming",
    dateLabel: "Autumn 2026",
    sortDate: "2026-10-01",
    city: "London",
    country: "United Kingdom",
    excerpt:
      "Applications are open. The theme is being kept close until launch.",
    story:
      "OmaHub is between editions. The next drop spotlights African designers you need to know — verified, curated, and ready to wear.",
    brandNames: [],
    applicationsOpen: true,
    themeAnnounced: false,
  },
  {
    slug: "summer-experience",
    number: "02",
    title: "Summer Experience",
    cardTitle: "Summer\nExperience",
    status: "past",
    dateLabel: "Summer 2026",
    sortDate: "2026-06-15",
    city: "London",
    country: "United Kingdom",
    lineupLabel: "8 brands",
    excerpt:
      "OmaHub's first full pop-up — designers from across the diaspora, curated and verified.",
    story:
      "Our first full London pop-up. Eight brands from across the diaspora came together for a day of discovery — every piece curated, every designer verified in person. Summer Experience set the template for how OmaHub editions run: theme first, campaign second, community always.",
    coverImage:
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/hero-images/2a14c31f_1755989245289.jpg",
    brandNames: [],
  },
  {
    slug: "unboxed-the-body-edition",
    number: "01",
    title: "Unboxed — The Body Edition",
    cardTitle: "Unboxed —\nThe Body Edition",
    status: "past",
    dateLabel: "December 2025",
    sortDate: "2025-12-06",
    city: "London",
    country: "United Kingdom",
    venue: "Gather House Africa",
    partner: "Gather House Africa",
    lineupLabel: "6 designers",
    excerpt:
      "A panel on wellness, health, and body positivity with a doctor, nutritionist, and two designers — where fashion met the body conversation.",
    story:
      "The edition that started it all. In partnership with Gather House Africa, Unboxed brought a doctor, a nutritionist, and two designers to the same table for a conversation about wellness, health, and body positivity — where fashion met the body conversation. Six designers showed alongside the panel.",
    coverImage:
      "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/spotlight-images/main/2a14c31f_1774219775328.jpg",
    brandNames: [],
  },
];

const byNewest = (a: Edition, b: Edition) =>
  b.sortDate.localeCompare(a.sortDate);

export function getAllEditions(): Edition[] {
  return [...editions].sort(byNewest);
}

export function getPastEditions(limit?: number): Edition[] {
  const past = editions.filter((e) => e.status === "past").sort(byNewest);
  return typeof limit === "number" ? past.slice(0, limit) : past;
}

export function getUpcomingEdition(): Edition | null {
  const upcoming = editions
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  return upcoming[0] ?? null;
}

export function getEditionBySlug(slug: string): Edition | null {
  return editions.find((e) => e.slug === slug) ?? null;
}

/** The most recent past edition — used for the hero "Watch" link. */
export function getLatestPastEdition(): Edition | null {
  return getPastEditions(1)[0] ?? null;
}
