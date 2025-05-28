/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next",

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
    domains: ["gswduyodzdgucjscjtvz.supabase.co"],
    remotePatterns: [
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
