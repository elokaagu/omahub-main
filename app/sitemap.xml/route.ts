import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

// Static pages that should always be included
const staticPages = [
  {
    url: "https://www.oma-hub.com",
    lastModified: new Date().toISOString(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: "https://www.oma-hub.com/about",
    lastModified: new Date().toISOString(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: "https://www.oma-hub.com/contact",
    lastModified: new Date().toISOString(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: "https://www.oma-hub.com/faq",
    lastModified: new Date().toISOString(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: "https://www.oma-hub.com/how-it-works",
    lastModified: new Date().toISOString(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: "https://www.oma-hub.com/directory",
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: "https://www.oma-hub.com/collections",
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: "https://www.oma-hub.com/tailors",
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: "https://www.oma-hub.com/tailored",
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    url: "https://www.oma-hub.com/join",
    lastModified: new Date().toISOString(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: "https://www.oma-hub.com/privacy-policy",
    lastModified: new Date().toISOString(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: "https://www.oma-hub.com/terms-of-service",
    lastModified: new Date().toISOString(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

// Generate XML sitemap
function generateSitemap(
  pages: Array<{
    url: string;
    lastModified: string;
    changeFrequency: string;
    priority: number;
  }>
) {
  // Remove duplicates and ensure consistent URL formatting
  const uniquePages = pages.reduce((acc, page) => {
    const normalizedUrl = page.url.toLowerCase().trim();
    if (!acc.has(normalizedUrl)) {
      acc.set(normalizedUrl, page);
    }
    return acc;
  }, new Map());

  const sortedPages = Array.from(uniquePages.values()).sort((a, b) => {
    // Sort by priority first, then by URL
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return a.url.localeCompare(b.url);
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sortedPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return sitemap;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const allPages = [...staticPages];

    // Fetch dynamic content from database
    const [brandsResult, productsResult, collectionsResult, tailorsResult] =
      await Promise.allSettled([
        // Get all brands
        supabase
          .from("brands")
          .select("id, updated_at")
          .eq("is_verified", true)
          .order("updated_at", { ascending: false }),

        // Get all products
        supabase
          .from("products")
          .select("id, updated_at")
          .eq("in_stock", true)
          .order("updated_at", { ascending: false }),

        // Get all collections
        supabase
          .from("catalogues")
          .select("id, updated_at")
          .order("updated_at", { ascending: false }),

        // Get all tailors
        supabase
          .from("tailors")
          .select("id, updated_at")
          .order("updated_at", { ascending: false }),
      ]);

    // Add brand pages
    if (brandsResult.status === "fulfilled" && brandsResult.value.data) {
      brandsResult.value.data.forEach((brand) => {
        allPages.push({
          url: `https://www.oma-hub.com/brand/${brand.id}`,
          lastModified: brand.updated_at || new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      });
    }

    // Add product pages
    if (productsResult.status === "fulfilled" && productsResult.value.data) {
      productsResult.value.data.forEach((product) => {
        allPages.push({
          url: `https://www.oma-hub.com/product/${product.id}`,
          lastModified: product.updated_at || new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
    }

    // Add collection pages
    if (
      collectionsResult.status === "fulfilled" &&
      collectionsResult.value.data
    ) {
      collectionsResult.value.data.forEach((collection) => {
        allPages.push({
          url: `https://www.oma-hub.com/collection/${collection.id}`,
          lastModified: collection.updated_at || new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      });
    }

    // Add tailor pages
    if (tailorsResult.status === "fulfilled" && tailorsResult.value.data) {
      tailorsResult.value.data.forEach((tailor) => {
        allPages.push({
          url: `https://www.oma-hub.com/tailor/${tailor.id}`,
          lastModified: tailor.updated_at || new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      });
    }

    // Generate the sitemap XML
    const sitemap = generateSitemap(allPages);

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", // Cache for 1 hour, stale for 24 hours
        "X-Robots-Tag": "index, follow",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);

    // Return a basic sitemap with just static pages if there's an error
    const basicSitemap = generateSitemap(staticPages);

    return new NextResponse(basicSitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600", // Shorter cache on error
        "X-Robots-Tag": "index, follow",
      },
    });
  }
}
