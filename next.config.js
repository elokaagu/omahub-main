// Load environment variables from production file if .env.local doesn't exist
const fs = require("fs");
const path = require("path");

// Check if .env.local exists, if not, load from env.production
if (!fs.existsSync(path.join(__dirname, ".env.local"))) {
  require("dotenv").config({ path: path.join(__dirname, "env.production") });
}

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "gstatic-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-font-assets",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-image",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "apis",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "others",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  fallbacks: {
    document: "/offline",
  },
});

function supabaseStorageRemotePatterns() {
  const patterns = [];
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw) {
    try {
      const host = new URL(raw).hostname;
      if (host) {
        patterns.push({
          protocol: "https",
          hostname: host,
          pathname: "/storage/v1/object/**",
        });
      }
    } catch {
      /* ignore invalid env */
    }
  }
  return patterns;
}

/** @type {import('next').NextConfig} */
// Content-Security-Policy. Google Tag Manager + GA4 (components/analytics)
// load from *.googletagmanager.com; their beacons go to Google hosts, which
// `img-src` / `connect-src https:` already allow. Vercel Analytics uses
// same-origin /_vercel/insights in production, and va.vercel-scripts.com
// for its debug script in development only.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "https://*.googletagmanager.com",
    process.env.NODE_ENV === "production" ? "" : "https://va.vercel-scripts.com",
  ]
    .filter(Boolean)
    .join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src 'self' https: data:",
  "font-src 'self' data:",
  "frame-src 'self' https://player.vimeo.com https://www.googletagmanager.com",
  "connect-src 'self' https: wss: https://gswduyodzdgucjscjtvz.supabase.co",
].join("; ") + ";";

const nextConfig = {
  // Ensure consistent trailing slash handling to prevent duplicate content
  trailingSlash: false,
  // No custom webpack splitChunks: Next.js's default per-route code splitting
  // keeps each page's code out of the shared bundle. (A previous custom
  // config forced all app code - including the whole Studio - into one chunk
  // loaded on every page, and disabled sideEffects-based tree-shaking.)

  // Phase 2C: Enhanced image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    // Remove the overly restrictive CSP that was blocking images
    // contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      ...supabaseStorageRemotePatterns(),
      {
        protocol: "https",
        hostname: "gswduyodzdgucjscjtvz.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Phase 2C: Video optimization and security
  async rewrites() {
    return [
      {
        source: "/api/video/:path*",
        destination:
          "https://gswduyodzdgucjscjtvz.supabase.co/storage/v1/object/public/:path*",
      },
    ];
  },

  // Phase 2C: Enhanced security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: CONTENT_SECURITY_POLICY,
          },
        ],
      },
      // No blanket Cache-Control for /api: most API routes are per-user or
      // signed-in. Public routes set their own (lib/http/cacheHeaders.ts).
      // Production static files have content-hashed URLs, so caching them
      // forever is safe. In `next dev` the URLs are NOT hashed - caching them
      // "immutable" makes the browser keep running old code after edits.
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/_next/static/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  // Phase 2C: Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "framer-motion",
    ],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Phase 2C: Bundle analyzer support
  ...(process.env.ANALYZE === "true" && {
    webpack: (config) => {
      config.plugins.push(
        new (require("webpack-bundle-analyzer").BundleAnalyzerPlugin)({
          analyzerMode: "static",
          openAnalyzer: false,
        })
      );
      return config;
    },
  }),
};

module.exports = withPWA(nextConfig);
