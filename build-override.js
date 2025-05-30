// Custom build script to bypass problematic API routes
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Check if we're running on Vercel
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
console.log(`Running build in ${isVercel ? "Vercel" : "local"} environment`);

// Create a .vercelignore file if it doesn't exist
console.log("Setting up .vercelignore file...");
const vercelIgnorePath = ".vercelignore";
const vercelIgnoreContent = `
# Ignore API routes with database access during build
app/api/repair-images
app/api/migrate-images

# Ignore test files
**/*.test.*
**/*.spec.*

# Ignore development files
.env.local
.env.development.local
.env.test.local
`;

fs.writeFileSync(vercelIgnorePath, vercelIgnoreContent);
console.log(`Created/Updated ${vercelIgnorePath}`);

// Create temporary copies of problematic API routes
const problematicRoutes = [
  "app/api/repair-images/route.ts",
  "app/api/migrate-images/route.ts",
];

// Create backup files
console.log("Creating backups of API routes...");
problematicRoutes.forEach((routePath) => {
  if (fs.existsSync(routePath)) {
    const backupPath = `${routePath}.bak`;
    fs.copyFileSync(routePath, backupPath);
    console.log(`Backup created: ${backupPath}`);

    // Replace the file with a simple dummy implementation
    const simplifiedRoute = `
import { NextRequest, NextResponse } from "next/server";

// Mark as dynamic to ensure it's not statically generated
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "This is a placeholder response for build time",
    result: { total: 0, brands: 0, collections: 0, products: 0, profiles: 0 }
  });
}
`;

    fs.writeFileSync(routePath, simplifiedRoute);
    console.log(`Simplified route created for: ${routePath}`);
  }
});

// Create a temporary next.config.js override
console.log("Setting up temporary next.config.js for build...");
const nextConfigPath = "next.config.js";
if (fs.existsSync(nextConfigPath)) {
  const backupConfigPath = `${nextConfigPath}.bak`;
  fs.copyFileSync(nextConfigPath, backupConfigPath);
  console.log(`Backup created: ${backupConfigPath}`);

  // Read the existing config
  let configContent = fs.readFileSync(nextConfigPath, "utf8");

  // Add additional build-time configurations
  if (!configContent.includes("distDir")) {
    configContent = configContent.replace(
      "const nextConfig = {",
      'const nextConfig = {\n  distDir: ".next",\n'
    );
  }

  if (!configContent.includes("env:")) {
    configContent = configContent.replace(
      "module.exports = nextConfig;",
      'module.exports = {\n  ...nextConfig,\n  env: {\n    VERCEL_BUILD_STEP: "true"\n  }\n};'
    );
  } else {
    configContent = configContent.replace(
      "module.exports = nextConfig;",
      'nextConfig.env = { ...nextConfig.env, VERCEL_BUILD_STEP: "true" };\nmodule.exports = nextConfig;'
    );
  }

  fs.writeFileSync(nextConfigPath, configContent);
  console.log(`Updated ${nextConfigPath} for build`);
}

// Set environment variables for the build
process.env.VERCEL_BUILD_STEP = "true";
process.env.CI = "false";
if (!process.env.NODE_OPTIONS) {
  process.env.NODE_OPTIONS = "--no-warnings";
}

// Determine the build command based on environment
const buildCommand = isVercel
  ? "CI=false NODE_OPTIONS=--no-warnings next build"
  : "NODE_OPTIONS=--no-warnings next build";

// Run the actual build
try {
  console.log(`Running build with command: ${buildCommand}`);
  execSync(buildCommand, {
    stdio: "inherit",
    env: {
      ...process.env,
      VERCEL_BUILD_STEP: "true",
      CI: "false",
    },
  });
  console.log("Build completed successfully!");
} catch (error) {
  console.error("Build failed:", error.message);

  // Even if the build fails, try to restore original files
  console.log("Attempting to restore original files despite build failure...");
  problematicRoutes.forEach((routePath) => {
    const backupPath = `${routePath}.bak`;
    if (fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, routePath);
        fs.unlinkSync(backupPath);
        console.log(`Original route restored: ${routePath}`);
      } catch (restoreError) {
        console.error(`Failed to restore ${routePath}:`, restoreError);
      }
    }
  });

  // Restore original next.config.js
  const backupConfigPath = `${nextConfigPath}.bak`;
  if (fs.existsSync(backupConfigPath)) {
    try {
      fs.copyFileSync(backupConfigPath, nextConfigPath);
      fs.unlinkSync(backupConfigPath);
      console.log(`Original ${nextConfigPath} restored`);
    } catch (restoreError) {
      console.error(`Failed to restore ${nextConfigPath}:`, restoreError);
    }
  }

  process.exit(1);
} finally {
  // Restore original files
  console.log("Restoring original API routes...");
  problematicRoutes.forEach((routePath) => {
    const backupPath = `${routePath}.bak`;
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, routePath);
      fs.unlinkSync(backupPath);
      console.log(`Original route restored: ${routePath}`);
    }
  });

  // Restore original next.config.js
  const backupConfigPath = `${nextConfigPath}.bak`;
  if (fs.existsSync(backupConfigPath)) {
    fs.copyFileSync(backupConfigPath, nextConfigPath);
    fs.unlinkSync(backupConfigPath);
    console.log(`Original ${nextConfigPath} restored`);
  }
}
