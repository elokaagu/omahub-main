import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/seo";

/**
 * Robots.txt is a blocklist: everything is allowed unless Disallow matches.
 * AI crawlers (GPTBot, ClaudeBot, etc.) are explicitly allowed for GEO/AEO.
 */
export async function GET() {
  const siteUrl = getSiteUrl();

  const robotsTxt = `# OmaHub — ${siteUrl}
# AI/LLM context file: ${siteUrl}/llms.txt

User-agent: *
Allow: /

# Private, auth, and non-indexable areas
Disallow: /studio/
Disallow: /api/
Disallow: /auth/
Disallow: /admin/
Disallow: /offline/
Disallow: /test-contact-form/

# Limit duplicate / filtered listings via query strings (crawl budget)
Disallow: /*?*

# Answer-engine and generative crawlers — allowed for GEO/AEO
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
