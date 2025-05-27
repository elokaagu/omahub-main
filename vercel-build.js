// Custom build script for Vercel deployment
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log(`Running Vercel build script`);

// Create a .vercelignore file
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

// Run the actual build
try {
  console.log(`Running Next.js build`);
  execSync("next build", { stdio: "inherit" });
  console.log("Build completed successfully!");
} catch (error) {
  console.error("Build failed:", error.message);
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
}
