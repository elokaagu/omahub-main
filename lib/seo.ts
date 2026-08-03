import type { Metadata } from "next";

export const SITE_NAME = "OmaHub";
export const SITE_TAGLINE =
  "Curated African fashion platform — verified designers, storytelling-led editions, and bespoke tailoring.";
export const SITE_DESCRIPTION =
  "Discover curated African fashion brands, bespoke tailors, and occasion-ready collections on OmaHub. Verified designers from Lagos, Accra, Nairobi, London and the diaspora.";

/** Canonical production origin; always use for SEO URLs and JSON-LD. */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.oma-hub.com"
  );
}

export function absoluteUrl(path: string = ""): string {
  const base = getSiteUrl();
  if (!path) return base;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

// SEO utility functions for generating dynamic metadata
export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  price?: number;
  currency?: string;
  availability?: "in stock" | "out of stock" | "preorder";
  brand?: string;
  category?: string;
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = "/OmaHubBanner.png",
    url,
    type = "website",
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
    price,
    currency,
    availability = "in stock",
    brand,
    category,
  } = config;

  /** Production site origin; joined with `url` when `url` is a path (e.g. "/about"). */
  const baseUrl = getSiteUrl();
  const fullUrl = url ? absoluteUrl(url) : baseUrl;
  const fullImageUrl = image.startsWith("http") ? image : absoluteUrl(image);

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: author ? [{ name: author }] : undefined,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      type: type === "product" ? "website" : type,
      title,
      description,
      url: fullUrl,
      siteName: "OmaHub",
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullImageUrl],
      creator: "@omahub",
      site: "@omahub",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };

  // Note: Product-specific OpenGraph metadata is handled via structured data
  // OpenGraph doesn't support product type in Next.js metadata API

  return metadata;
}

// Generate structured data (JSON-LD) for different content types
export function generateStructuredData(
  type: "organization" | "website" | "product" | "brand" | "collection",
  data: Record<string, unknown>,
) {
  const baseUrl = getSiteUrl();

  switch (type) {
    case "organization":
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: SITE_NAME,
        url: baseUrl,
        logo: absoluteUrl("/lovable-uploads/omahub-logo.png"),
        image: absoluteUrl("/OmaHubBanner.png"),
        description:
          typeof data?.description === "string" && data.description.trim()
            ? data.description
            : SITE_DESCRIPTION,
        slogan: "Where African fashion finds its audience",
        email: "info@oma-hub.com",
        sameAs: [
          "https://www.instagram.com/_omahub/",
          "https://www.tiktok.com/@_omahub",
          "https://twitter.com/omahub",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          email: "info@oma-hub.com",
          contactType: "customer service",
          areaServed: ["NG", "GH", "KE", "GB", "Worldwide"],
          availableLanguage: ["English"],
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Lagos",
          addressCountry: "NG",
        },
        areaServed: [
          { "@type": "City", name: "Lagos" },
          { "@type": "City", name: "Accra" },
          { "@type": "City", name: "Nairobi" },
          { "@type": "City", name: "London" },
          { "@type": "Place", name: "Worldwide" },
        ],
        knowsAbout: [
          "African fashion",
          "Emerging fashion designers",
          "Bespoke tailoring",
          "Fashion pop-up events",
          "Curated designer directories",
          "Bridal and occasion wear",
          "Contemporary African luxury fashion",
        ],
      };

    case "website":
      return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: SITE_NAME,
        url: baseUrl,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${baseUrl}/#organization` },
        inLanguage: "en",
      };

    case "product":
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: data.name,
        description: data.description,
        image: data.images || [],
        url: data.url ? absoluteUrl(String(data.url)) : undefined,
        brand: {
          "@type": "Brand",
          name: data.brandName,
        },
        category: data.category,
        offers: {
          "@type": "Offer",
          price: data.price,
          priceCurrency: data.currency || "USD",
          availability:
            data.availability === "in stock"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url: data.url ? absoluteUrl(String(data.url)) : undefined,
          seller: {
            "@type": "Organization",
            name: SITE_NAME,
            url: baseUrl,
          },
        },
        ...(data.rating
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: data.rating,
                reviewCount: data.reviewCount || 1,
              },
            }
          : {}),
      };

    case "brand":
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${baseUrl}/brand/${data.id}#brand`,
        name: data.name,
        description: data.description,
        url: `${baseUrl}/brand/${data.id}`,
        logo: data.logo,
        image: data.images || [],
        ...(data.location
          ? {
              address: {
                "@type": "PostalAddress",
                addressLocality: data.location,
              },
            }
          : {}),
        sameAs: data.socialLinks || [],
        ...(data.foundedYear ? { foundingDate: String(data.foundedYear) } : {}),
      };

    case "collection":
      return {
        "@context": "https://schema.org",
        "@type": "Collection",
        name: data.name,
        description: data.description,
        url: `${baseUrl}/collection/${data.id}`,
        image: data.image,
        creator: {
          "@type": "Organization",
          name: data.brandName,
        },
        dateCreated: data.createdAt,
        numberOfItems: data.itemCount,
      };

    default:
      return null;
  }
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
) {
  const baseUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

// Generate FAQ structured data
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** ItemList for directory and listing pages (SEO + AEO entity discovery). */
export function generateItemListStructuredData(
  name: string,
  description: string,
  items: Array<{ name: string; url: string; image?: string }>,
) {
  const baseUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

/** Event schema for OmaHub editions (GEO: city/country + temporal signals). */
export function generateEditionEventStructuredData(data: {
  slug: string;
  title: string;
  description: string;
  startDate: string;
  city: string;
  country: string;
  venue?: string;
  image?: string;
  status: "past" | "upcoming";
}) {
  const baseUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: data.title,
    description: data.description,
    startDate: data.startDate,
    eventStatus:
      data.status === "upcoming"
        ? "https://schema.org/EventScheduled"
        : "https://schema.org/EventCompleted",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: data.venue || data.city,
      address: {
        "@type": "PostalAddress",
        addressLocality: data.city,
        addressCountry: data.country,
      },
    },
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: baseUrl,
      sameAs: "https://www.instagram.com/_omahub/",
    },
    image: data.image ? [data.image] : [absoluteUrl("/OmaHubBanner.png")],
    url: `${baseUrl}/editions/${data.slug}`,
  };
}

/** WebPage + speakable hints for answer engines on key landing pages. */
export function generateWebPageStructuredData(data: {
  name: string;
  description: string;
  url: string;
  speakableText?: string;
}) {
  const baseUrl = getSiteUrl();
  const pageUrl = data.url.startsWith("http")
    ? data.url
    : `${baseUrl}${data.url}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.name,
    description: data.description,
    url: pageUrl,
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@id": `${baseUrl}/#organization` },
    inLanguage: "en",
    ...(data.speakableText
      ? {
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", "h2", "[data-speakable]"],
          },
        }
      : {}),
  };
}

// SEO-friendly URL generation
export function generateSEOFriendlySlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Meta description optimization
export function optimizeMetaDescription(
  description: string,
  maxLength: number = 160
): string {
  if (description.length <= maxLength) {
    return description;
  }

  // Try to cut at sentence boundary
  const sentences = description.split(". ");
  let result = "";

  for (const sentence of sentences) {
    if ((result + sentence + ". ").length <= maxLength) {
      result += sentence + ". ";
    } else {
      break;
    }
  }

  // If no complete sentences fit, cut at word boundary
  if (!result) {
    const words = description.split(" ");
    for (const word of words) {
      if ((result + word + " ").length <= maxLength) {
        result += word + " ";
      } else {
        break;
      }
    }
  }

  return result.trim();
}

// Generate page-specific keywords
export function generatePageKeywords(
  baseKeywords: string[],
  pageSpecific: string[]
): string[] {
  const allKeywords = [...baseKeywords, ...pageSpecific];
  return [...new Set(allKeywords)]; // Remove duplicates
}
