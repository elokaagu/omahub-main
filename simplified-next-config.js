/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
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
  env: {
    NEXT_PUBLIC_RUNTIME: "true",
    NEXT_IGNORE_TYPESCRIPT_ERRORS: "true",
    NEXT_IGNORE_ESM_VALIDATE: "true",
  },
  experimental: {
    optimizeCss: false,
    scrollRestoration: false,
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  transpilePackages: ["lucide-react"],
};

module.exports = nextConfig;
