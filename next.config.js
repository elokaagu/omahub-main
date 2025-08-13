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
        pathname: "/**",
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
  // Enhanced experimental features for Phase 2 bundle optimization
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: ["@/components", "@/lib", "lucide-react"],
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
    // Phase 2: Advanced bundle optimization
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    // Enable webpack bundle analyzer in development
    webpackBuildWorker: true,
  },
  // Phase 2: Advanced performance optimizations
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  // Use standard output for Vercel - do not use 'export' which breaks middleware
  output: undefined,
  // Enable source maps in development only
  productionBrowserSourceMaps: false,
  transpilePackages: ["lucide-react"],
  // Phase 2: Advanced compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    // Remove unused CSS
    styledComponents: true,
  },
  // Phase 2: Webpack optimizations for bundle size reduction
  webpack: (config, { dev, isServer }) => {
    // Only apply production optimizations
    if (!dev && !isServer) {
      // Enable aggressive tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.concatenateModules = true;
      config.optimization.minimize = true;
      
      // Phase 2B: Aggressive vendor chunk splitting
      config.optimization.splitChunks = {
        chunks: "all",
        maxInitialRequests: 25, // Allow more chunks for better splitting
        maxAsyncRequests: 25,
        minSize: 20000, // Smaller chunks for better caching
        maxSize: 244000, // Target chunks under 250KB
        cacheGroups: {
          // Supabase - separate chunk for database operations
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: "supabase",
            chunks: "all",
            priority: 20,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Lucide React - separate chunk for icons
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: "lucide-icons",
            chunks: "all",
            priority: 20,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Framer Motion - separate chunk for animations
          framer: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: "framer-motion",
            chunks: "all",
            priority: 20,
            enforce: true,
            reuseExistingChunk: true,
          },
          // React and React DOM - separate chunk
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react-vendor",
            chunks: "all",
            priority: 30,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Next.js - separate chunk
          next: {
            test: /[\\/]node_modules[\\/]next[\\/]/,
            name: "next-vendor",
            chunks: "all",
            priority: 25,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Tailwind CSS and styling - separate chunk
          styles: {
            test: /[\\/]node_modules[\\/](tailwindcss|@tailwindcss|autoprefixer)[\\/]/,
            name: "tailwind-styles",
            chunks: "all",
            priority: 15,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Other large packages
          largePackages: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|@heroicons|clsx|class-variance-authority)[\\/]/,
            name: "large-packages",
            chunks: "all",
            priority: 15,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Common vendor packages
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
            reuseExistingChunk: true,
          },
          // Common chunks for shared code
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
      
      // Phase 2B: Module concatenation optimization
      config.optimization.concatenateModules = true;
      
      // Phase 2B: Enable scope hoisting
      config.optimization.moduleIds = "deterministic";
      config.optimization.chunkIds = "deterministic";
      
      // Phase 2B: CSS optimization
      config.optimization.minimize = true;
    }
    
    // Phase 2B: Bundle analyzer for development
    if (dev && process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "server",
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      );
    }
    
    // Phase 2B: Add bundle size monitoring
    if (!dev) {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          openAnalyzer: false,
          reportFilename: "bundle-analysis.html",
          generateStatsFile: true,
          statsFilename: "bundle-stats.json",
        })
      );
    }
    
    return config;
  },
};

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Phase 2: Enhanced PWA configuration
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 100,
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
          maxEntries: 100,
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
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 1, // 1 day
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

module.exports = withPWA(nextConfig);
