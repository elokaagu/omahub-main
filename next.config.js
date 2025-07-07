// Load environment variables from production file if .env.local doesn't exist
const fs = require("fs");
const path = require("path");

// Check if .env.local exists, if not, load from env.production
if (!fs.existsSync(path.join(__dirname, ".env.local"))) {
  require("dotenv").config({ path: path.join(__dirname, "env.production") });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gswduyodzdgucjscjtvz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  reactStrictMode: true,
  swcMinify: true,
  // Avoid including API routes that would fail during build
  excludeDefaultMomentLocales: true,
  // Environment variables for build time
  env: {
    NEXT_PUBLIC_RUNTIME: "true",
    NEXT_IGNORE_TYPESCRIPT_ERRORS: "true",
    NEXT_IGNORE_ESM_VALIDATE: "true",
    // Explicitly include Supabase environment variables
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: ["@/components", "@/lib"],
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  // Use standard output for Vercel - do not use 'export' which breaks middleware
  output: undefined,
  // Power settings for Vercel
  poweredByHeader: false,
  // Enable source maps in development only
  productionBrowserSourceMaps: false,
  transpilePackages: ["lucide-react"],
  // Optimize bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

// Do not add duplicate environment variables
module.exports = nextConfig;
