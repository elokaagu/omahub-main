"use client";

import {
  generateStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQStructuredData,
} from "@/lib/seo";

interface StructuredDataProps {
  type: "organization" | "website" | "product" | "brand" | "collection";
  data: any;
}

interface BreadcrumbProps {
  items: Array<{ name: string; url: string }>;
}

interface FAQProps {
  faqs: Array<{ question: string; answer: string }>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = generateStructuredData(type, data);

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

export function BreadcrumbStructuredData({ items }: BreadcrumbProps) {
  const structuredData = generateBreadcrumbStructuredData(items);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

export function FAQStructuredData({ faqs }: FAQProps) {
  const structuredData = generateFAQStructuredData(faqs);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

// Combined component for multiple structured data types
interface CombinedStructuredDataProps {
  organization?: any;
  website?: any;
  product?: any;
  brand?: any;
  collection?: any;
  breadcrumbs?: Array<{ name: string; url: string }>;
  faqs?: Array<{ question: string; answer: string }>;
}

export function CombinedStructuredData({
  organization,
  website,
  product,
  brand,
  collection,
  breadcrumbs,
  faqs,
}: CombinedStructuredDataProps) {
  const structuredDataArray = [];

  if (organization) {
    structuredDataArray.push(
      generateStructuredData("organization", organization)
    );
  }

  if (website) {
    structuredDataArray.push(generateStructuredData("website", website));
  }

  if (product) {
    structuredDataArray.push(generateStructuredData("product", product));
  }

  if (brand) {
    structuredDataArray.push(generateStructuredData("brand", brand));
  }

  if (collection) {
    structuredDataArray.push(generateStructuredData("collection", collection));
  }

  if (breadcrumbs) {
    structuredDataArray.push(generateBreadcrumbStructuredData(breadcrumbs));
  }

  if (faqs) {
    structuredDataArray.push(generateFAQStructuredData(faqs));
  }

  const combinedData = structuredDataArray.filter(Boolean);

  if (combinedData.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(combinedData),
      }}
    />
  );
}
