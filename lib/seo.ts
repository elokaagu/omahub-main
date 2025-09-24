import { Metadata } from "next";

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
    currency = "USD",
    availability = "in stock",
    brand,
    category,
  } = config;

  const baseUrl = "https://www.oma-hub.com";
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const fullImageUrl = image.startsWith("http") ? image : `${baseUrl}${image}`;

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: author ? [{ name: author }] : undefined,
    alternates: {
      canonical: url || "/",
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
  data: any
) {
  const baseUrl = "https://www.oma-hub.com";

  switch (type) {
    case "organization":
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "OmaHub",
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        description:
          "Premium fashion and tailoring platform connecting Africa's finest designers with a global audience",
        sameAs: [
          "https://twitter.com/omahub",
          "https://instagram.com/omahub",
          "https://facebook.com/omahub",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+1-XXX-XXX-XXXX",
          contactType: "customer service",
          areaServed: "Worldwide",
          availableLanguage: "English",
        },
        address: {
          "@type": "PostalAddress",
          addressCountry: "NG",
        },
      };

    case "website":
      return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "OmaHub",
        url: baseUrl,
        description: "Premium fashion and tailoring platform",
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      };

    case "product":
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: data.name,
        description: data.description,
        image: data.images || [],
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
          seller: {
            "@type": "Organization",
            name: "OmaHub",
          },
        },
        aggregateRating: data.rating
          ? {
              "@type": "AggregateRating",
              ratingValue: data.rating,
              reviewCount: data.reviewCount || 1,
            }
          : undefined,
      };

    case "brand":
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: data.name,
        description: data.description,
        url: `${baseUrl}/brand/${data.id}`,
        logo: data.logo,
        image: data.images || [],
        address: data.location
          ? {
              "@type": "PostalAddress",
              addressLocality: data.location,
            }
          : undefined,
        sameAs: data.socialLinks || [],
        foundingDate: data.foundedYear,
        numberOfEmployees: data.employeeCount,
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
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://www.oma-hub.com${item.url}`,
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
