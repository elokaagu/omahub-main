/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
  // Enable static exports
  output: "export",
  // Disable server-side features since we're using static export
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
