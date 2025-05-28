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
      {
        protocol: "https",
        hostname: "gswduyodzdgucjscjtvz.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    unoptimized: process.env.STATIC_EXPORT ? true : false,
  },
  reactStrictMode: false,
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
  // Use static export for Vercel, otherwise standard output
  output: process.env.STATIC_EXPORT ? "export" : undefined,
  // Power settings for Vercel
  poweredByHeader: false,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
};

// Do not add duplicate environment variables
module.exports = nextConfig;
