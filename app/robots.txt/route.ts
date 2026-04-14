import { NextResponse } from "next/server";

/**
 * Robots.txt is a blocklist: everything is allowed unless Disallow matches.
 * We do not use Allow: (except for rare overrides); omitting paths implies crawlable.
 *
 * `Disallow: /*?*` reduces duplicate/filter URLs; ensure important URLs in sitemap
 * are canonical (no query) or accept that those query variants won’t be crawled.
 */
export async function GET() {
  const robotsTxt = `User-agent: *

# Private, auth, and non-indexable areas
Disallow: /studio/
Disallow: /api/
Disallow: /auth/
Disallow: /admin/
Disallow: /offline/
Disallow: /test-contact-form/

# Limit duplicate / filtered listings via query strings (crawl budget)
Disallow: /*?*

Sitemap: https://www.oma-hub.com/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
