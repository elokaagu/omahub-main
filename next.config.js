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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure consistent trailing slash handling to prevent duplicate content
  trailingSlash: false,
  // Phase 2C: Advanced webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Advanced chunk splitting for better caching
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          // Vendor chunks with granular splitting
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
            enforce: true,
          },
          // React specific chunk
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react",
            chunks: "all",
            priority: 20,
            enforce: true,
          },
          // UI components chunk
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|framer-motion)[\\/]/,
            name: "ui",
            chunks: "all",
            priority: 15,
            enforce: true,
          },
          // Common chunks
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 5,
            reuseExistingChunk: true,
          },
          // Runtime chunk optimization
          runtime: {
            name: "runtime",
            chunks: "all",
            priority: 1,
            enforce: true,
          },
        },
      };

      // Enable advanced optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.concatenateModules = true;
      config.optimization.minimize = true;

      // Separate runtime chunk for better caching
      config.optimization.runtimeChunk = {
        name: "runtime",
      };
    }

    return config;
  },

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
      {
        protocol: "https",
        hostname: "gswduyodzdgucjscjtvz.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
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
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https: data:; font-src 'self' data:; connect-src 'self' https: wss: https://gswduyodzdgucjscjtvz.supabase.co;",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "connect-src 'self' https: wss: https://gswduyodzdgucjscjtvz.supabase.co;",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
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
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
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
