/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next",

  eslint: {
    // Disabling eslint during builds for production
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
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  reactStrictMode: true,
  swcMinify: true,
  // Avoid including API routes that would fail during build
  excludeDefaultMomentLocales: true,
  // Environment variables for build time
  env: {
    VERCEL_BUILD_STEP: process.env.VERCEL ? "true" : "false",
  },
  // Custom webpack configuration
  webpack: (config, { isServer }) => {
    // Handle the punycode deprecation warning
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }

    // Disable webpack warnings for cleaner build logs
    config.infrastructureLogging = {
      level: "error",
    };

    // Handle problematic modules
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    return config;
  },
  // Explicitly define runtime
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

// Do not add duplicate environment variables
module.exports = nextConfig;
