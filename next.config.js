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
    unoptimized: process.env.STATIC_EXPORT ? true : false,
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
  },
  // Disable experimental features
  experimental: {
    optimizeCss: false,
    scrollRestoration: false,
  },
  // Use standard output for Vercel - do not use 'export' which breaks middleware
  output: undefined,
  // Power settings for Vercel
  poweredByHeader: false,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  transpilePackages: ["lucide-react"],
};

// Do not add duplicate environment variables
module.exports = nextConfig;
