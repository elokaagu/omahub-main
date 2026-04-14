import { NextResponse } from "next/server";
import { createClient as createAnonServerClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-unified";

/** Sitemap is SEO data, not user-specific — cache and refresh periodically. */
export const revalidate = 3600;

type SitemapPage = {
  url: string;
  /** Omit when unknown; avoid fake “now” timestamps for static URLs. */
  lastModified?: string;
  changeFrequency: string;
  priority: number;
};

// Static pages (verified routes under app/)
const staticPages: SitemapPage[] = [
  {
    url: "https://www.oma-hub.com",
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: "https://www.oma-hub.com/about",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: "https://www.oma-hub.com/contact",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: "https://www.oma-hub.com/faq",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: "https://www.oma-hub.com/how-it-works",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: "https://www.oma-hub.com/directory",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: "https://www.oma-hub.com/collections",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: "https://www.oma-hub.com/tailors",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: "https://www.oma-hub.com/tailored",
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    url: "https://www.oma-hub.com/join",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: "https://www.oma-hub.com/privacy-policy",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: "https://www.oma-hub.com/terms-of-service",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Trim, normalize trailing slash on path, lowercase hostname only (preserve path case for IDs). */
function sitemapDedupeKey(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  const u = new URL(trimmed);
  u.hostname = u.hostname.toLowerCase();
  let path = u.pathname;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return `${u.protocol}//${u.hostname}${path === "" ? "/" : path}${u.search}`;
}

function createSitemapSupabaseClient() {
  try {
    return createAdminClient();
  } catch (e) {
    console.warn(
      "Sitemap: SUPABASE_SERVICE_ROLE_KEY unavailable, using anon client (RLS applies)",
      e
    );
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error("Missing Supabase URL or anon key for sitemap");
    }
    return createAnonServerClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}

function generateSitemap(pages: SitemapPage[]) {
  const uniquePages = pages.reduce((acc, page) => {
    const key = sitemapDedupeKey(page.url);
    if (!acc.has(key)) {
      acc.set(key, page);
    }
    return acc;
  }, new Map<string, SitemapPage>());

  const sortedPages = Array.from(uniquePages.values()).sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return a.url.localeCompare(b.url);
  });

  const body = sortedPages
    .map((page) => {
      const loc = escapeXml(page.url);
      const lastmod =
        page.lastModified != null && page.lastModified !== ""
          ? `\n    <lastmod>${escapeXml(page.lastModified)}</lastmod>`
          : "";
      return `  <url>
    <loc>${loc}</loc>${lastmod}
    <changefreq>${escapeXml(page.changeFrequency)}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function lastModFromRow(updatedAt: string | null | undefined): string | undefined {
  if (updatedAt == null || updatedAt === "") return undefined;
  return updatedAt;
}

export async function GET() {
  try {
    const supabase = createSitemapSupabaseClient();
    const allPages: SitemapPage[] = [...staticPages];

    const [brandsResult, productsResult, collectionsResult, tailorsResult] =
      await Promise.allSettled([
        supabase
          .from("brands")
          .select("id, updated_at")
          .eq("is_verified", true)
          .order("updated_at", { ascending: false }),

        supabase
          .from("products")
          .select("id, updated_at")
          .eq("in_stock", true)
          .order("updated_at", { ascending: false }),

        supabase
          .from("catalogues")
          .select("id, updated_at")
          .order("updated_at", { ascending: false }),

        supabase
          .from("tailors")
          .select("id, updated_at")
          .order("updated_at", { ascending: false }),
      ]);

    if (brandsResult.status === "fulfilled" && brandsResult.value.data) {
      brandsResult.value.data.forEach((brand) => {
        allPages.push({
          url: `https://www.oma-hub.com/brand/${brand.id}`,
          lastModified: lastModFromRow(brand.updated_at),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      });
    }

    if (productsResult.status === "fulfilled" && productsResult.value.data) {
      productsResult.value.data.forEach((product) => {
        allPages.push({
          url: `https://www.oma-hub.com/product/${product.id}`,
          lastModified: lastModFromRow(product.updated_at),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
    }

    if (
      collectionsResult.status === "fulfilled" &&
      collectionsResult.value.data
    ) {
      collectionsResult.value.data.forEach((collection) => {
        allPages.push({
          url: `https://www.oma-hub.com/collection/${collection.id}`,
          lastModified: lastModFromRow(collection.updated_at),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      });
    }

    if (tailorsResult.status === "fulfilled" && tailorsResult.value.data) {
      tailorsResult.value.data.forEach((tailor) => {
        allPages.push({
          url: `https://www.oma-hub.com/tailor/${tailor.id}`,
          lastModified: lastModFromRow(tailor.updated_at),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      });
    }

    const sitemap = generateSitemap(allPages);

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "index, follow",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);

    const basicSitemap = generateSitemap(staticPages);

    return new NextResponse(basicSitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Robots-Tag": "index, follow",
      },
    });
  }
}
