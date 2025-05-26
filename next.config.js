/** @type {import('next').NextConfig} */
const nextConfig = {
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

    return config;
  },
  // Force exact Node.js version
  experimental: {
    // Add any experimental features you want to enable
  },
};

module.exports = nextConfig;
