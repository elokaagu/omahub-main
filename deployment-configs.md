# OmaHub Deployment Configurations

This file contains all deployment configurations and options for the OmaHub platform.

## Vercel Configuration Options

### Basic Vercel.json Configuration

```json
{
  "version": 2,
  "buildCommand": "next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_RUNTIME": "true",
    "NEXT_IGNORE_TYPESCRIPT_ERRORS": "true",
    "NEXT_IGNORE_ESM_VALIDATE": "true",
    "NEXT_PUBLIC_SUPABASE_URL": "https://gswduyodzdgucjscjtvz.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.gEREBStwiffbTmAaZGmBBsXo4FYEqQat8TpT46sS60A"
  }
}
```

### Alternative Vercel.json with Builds Configuration

```json
{
  "version": 2,
  "framework": "nextjs",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "skipBuild": false,
        "followSymlinks": true
      }
    }
  ],
  "env": {
    "NEXT_PUBLIC_RUNTIME": "true",
    "NEXT_IGNORE_TYPESCRIPT_ERRORS": "true",
    "NEXT_IGNORE_ESM_VALIDATE": "true",
    "NEXT_PUBLIC_SUPABASE_URL": "https://gswduyodzdgucjscjtvz.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.gEREBStwiffbTmAaZGmBBsXo4FYEqQat8TpT46sS60A"
  }
}
```

## Next.js Configuration Options

### Simplified Next.js Config

```javascript
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
```

## Deployment Scripts

### Deploy with Simplified Config

This script (`scripts/deploy-with-simple-config.js`) replaces the next.config.js with a simplified version before deploying:

```javascript
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting deployment with simplified config...");

// Clear build cache
if (fs.existsSync(".next")) {
  console.log("🧹 Removing .next directory...");
  fs.rmSync(".next", { recursive: true, force: true });
}

// Backup original config
const nextConfigPath = path.join(process.cwd(), "next.config.js");
const simplifiedConfigPath = path.join(
  process.cwd(),
  "simplified-next-config.js"
);
const backupConfigPath = path.join(process.cwd(), "next.config.js.backup");

console.log("📦 Backing up original next.config.js...");
fs.copyFileSync(nextConfigPath, backupConfigPath);

try {
  // Replace with simplified config
  console.log("🔄 Replacing next.config.js with simplified version...");
  fs.copyFileSync(simplifiedConfigPath, nextConfigPath);

  // Create simpler vercel.json
  console.log("📝 Creating simple vercel.json...");
  const vercelConfig = {
    version: 2,
    buildCommand: "next build",
    installCommand: "npm install",
    framework: "nextjs",
    env: {
      NEXT_PUBLIC_RUNTIME: "true",
      NEXT_IGNORE_TYPESCRIPT_ERRORS: "true",
      NEXT_IGNORE_ESM_VALIDATE: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://gswduyodzdgucjscjtvz.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.gEREBStwiffbTmAaZGmBBsXo4FYEqQat8TpT46sS60A",
    },
  };
  fs.writeFileSync(
    path.join(process.cwd(), "vercel.json"),
    JSON.stringify(vercelConfig, null, 2)
  );

  // Deploy to Vercel
  console.log("🚀 Deploying to Vercel...");
  execSync("npx vercel --prod", { stdio: "inherit" });
  console.log("✅ Deployment initiated!");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
} finally {
  // Restore original config
  console.log("🔄 Restoring original next.config.js...");
  fs.copyFileSync(backupConfigPath, nextConfigPath);
  fs.unlinkSync(backupConfigPath);
}
```

### Super Simple Vercel Deployment

This script (`scripts/deploy-vercel-simple.js`) creates a minimal vercel.json before deploying:

```javascript
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting super simple Vercel deployment...");

// Clear build cache
if (fs.existsSync(".next")) {
  console.log("🧹 Removing .next directory...");
  fs.rmSync(".next", { recursive: true, force: true });
}

// Create a temporary vercel.json with minimal settings
console.log("📝 Creating minimal vercel.json configuration...");
const minimalConfig = {
  version: 2,
  framework: "nextjs",
  builds: [
    {
      src: "package.json",
      use: "@vercel/next",
      config: {
        skipBuild: false,
        followSymlinks: true,
      },
    },
  ],
  env: {
    NEXT_PUBLIC_RUNTIME: "true",
    NEXT_IGNORE_TYPESCRIPT_ERRORS: "true",
    NEXT_IGNORE_ESM_VALIDATE: "true",
    NEXT_PUBLIC_SUPABASE_URL: "https://gswduyodzdgucjscjtvz.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.gEREBStwiffbTmAaZGmBBsXo4FYEqQat8TpT46sS60A",
  },
};

const vercelConfigPath = path.join(process.cwd(), "vercel.json");
const originalConfig = fs.existsSync(vercelConfigPath)
  ? JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"))
  : null;

// Backup original vercel.json if it exists
if (originalConfig) {
  console.log("📦 Backing up original vercel.json...");
  fs.writeFileSync(
    path.join(process.cwd(), "vercel.json.backup"),
    JSON.stringify(originalConfig, null, 2)
  );
}

// Write the minimal config
fs.writeFileSync(vercelConfigPath, JSON.stringify(minimalConfig, null, 2));

try {
  // Deploy using standard options
  console.log("🚀 Deploying to Vercel...");
  execSync("npx vercel --prod", { stdio: "inherit" });
  console.log("✅ Deployment initiated!");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
} finally {
  // Restore original vercel.json if it existed
  if (originalConfig) {
    console.log("🔄 Restoring original vercel.json...");
    fs.writeFileSync(vercelConfigPath, JSON.stringify(originalConfig, null, 2));
  }
}
```

## Environment Variables

These environment variables should be set in your Vercel project:

```
NEXT_PUBLIC_RUNTIME=true
NEXT_IGNORE_TYPESCRIPT_ERRORS=true
NEXT_IGNORE_ESM_VALIDATE=true
NEXT_PUBLIC_SUPABASE_URL=https://gswduyodzdgucjscjtvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.gEREBStwiffbTmAaZGmBBsXo4FYEqQat8TpT46sS60A
```

## Deployment Commands

Here are all the deployment commands from package.json:

```json
{
  "deploy": "node deploy.js && npx vercel --prod",
  "deploy:ci": "CI=false NODE_OPTIONS=\"--no-warnings\" npx vercel --prod --build-env VERCEL_BUILD_STEP=true --build-env CI=false --build-env NODE_OPTIONS=\"--no-warnings\"",
  "deploy:clean": "node scripts/deploy-to-vercel.js",
  "deploy:simple": "node scripts/deploy-simple.js",
  "deploy:vercel": "node scripts/deploy-vercel.js",
  "deploy:super-clean": "node scripts/clean-deploy.js",
  "deploy:super-simple": "node scripts/deploy-vercel-simple.js",
  "deploy:with-simple-config": "node scripts/deploy-with-simple-config.js",
  "simple-deploy": "npx vercel --prod"
}
```

## GitHub Integration with Vercel (Recommended)

For the most reliable deployment, use the GitHub integration with Vercel:

1. Go to the Vercel dashboard: https://vercel.com
2. Click on "New Project"
3. Import your GitHub repository (elokaagu/omahub-main)
4. Configure with these settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: NEXT_IGNORE_TYPESCRIPT_ERRORS=true next build
   - Environment Variables: Add all the environment variables listed above
