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
  /** Event photography shown in the edition's gallery */
  gallery?: {
    src: string;
    alt: string;
    /** Full-resolution version offered as a download; falls back to `src` */
    downloadSrc?: string;
  }[];
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
    gallery: [
      {
        src: "/images/editions/summer-01.jpg",
        alt: "Model in a green tank surrounded by summer florals",
      },
      {
        src: "/images/editions/summer-02.jpg",
        alt: "Geometric-print halter dress shot in the garden",
      },
      {
        src: "/images/editions/summer-03.jpg",
        alt: "Yellow lace-back gown against a sunlit arch",
      },
      {
        src: "/images/editions/summer-04.jpg",
        alt: "Hand-beaded bag in citrus tones",
      },
    ],
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
    gallery: [
      {
        src: "/images/editions/unboxed-gallery/unboxed-19.jpg",
        alt: "The OmaHub team and guests together after the panel",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-19-original.jpg?download=unboxed-19.jpg",
      },
      {
        src: "/images/editions/unboxed-gallery/unboxed-04.jpg",
        alt: "A guest in a red taffeta gown reviewing notes ahead of the panel",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-04-original.jpg?download=unboxed-04.jpg",
      },
      {
        src: "/images/editions/unboxed-gallery/unboxed-22.jpg",
        alt: "A panel guest mid-story, gesturing beside a tablet",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-22-original.jpg?download=unboxed-22.jpg",
      },
      {
        src: "/images/editions/unboxed-gallery/unboxed-20.jpg",
        alt: "Two guests in conversation between panel sessions",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-20-original.jpg?download=unboxed-20.jpg",
      },
      {
        src: "/images/editions/unboxed-gallery/unboxed-11.jpg",
        alt: "A guest speaking mid-conversation in a red off-shoulder gown",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-11-original.jpg?download=unboxed-11.jpg",
      },
      {
        src: "/images/editions/unboxed-gallery/unboxed-37.jpg",
        alt: "Two guests catching up beside the styling rail",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-37-original.jpg?download=unboxed-37.jpg",
      },
      {
        src: "/images/editions/unboxed-gallery/unboxed-06.jpg",
        alt: "Wide view of the panel setup as the OmaHub team films",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-06-original.jpg?download=unboxed-06.jpg",
      },
      {
        src: "/images/editions/unboxed-gallery/unboxed-33.jpg",
        alt: "A candid moment between guests and the OmaHub team",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-33-original.jpg?download=unboxed-33.jpg",
      },
      {
        src: "/images/editions/unboxed-gallery/unboxed-35.jpg",
        alt: "A guest smiling backstage as the photographer works",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-35-original.jpg?download=unboxed-35.jpg",
      },
      {
        src: "/images/editions/unboxed-gallery/unboxed-31.jpg",
        alt: "Behind the scenes on the styling rack",
        downloadSrc:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/edition-galleries/unboxed-the-body-edition/unboxed-31-original.jpg?download=unboxed-31.jpg",
      },
    ],
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
