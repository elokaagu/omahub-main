import { NextResponse } from "next/server";

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /studio/
Disallow: /api/
Disallow: /auth/
Disallow: /admin/
Disallow: /password-gate/
Disallow: /offline/
Disallow: /test-contact-form/

# Allow important pages
Allow: /brand/
Allow: /product/
Allow: /collection/
Allow: /tailor/
Allow: /directory/
Allow: /collections/
Allow: /tailors/

# Sitemap location
Sitemap: https://www.oma-hub.com/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
}
