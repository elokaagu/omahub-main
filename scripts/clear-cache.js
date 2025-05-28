#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🧹 Clearing Next.js cache...");

// Get the root directory of the project
const rootDir = process.cwd();

// Path to .next directory
const nextCachePath = path.join(rootDir, ".next");
if (fs.existsSync(nextCachePath)) {
  console.log("Removing .next directory...");
  try {
    fs.rmSync(nextCachePath, { recursive: true, force: true });
    console.log("✅ .next directory removed successfully.");
  } catch (error) {
    console.error("❌ Error removing .next directory:", error.message);
  }
} else {
  console.log("⚠️ .next directory not found.");
}

// Path to node_modules/.cache directory
const nodeCachePath = path.join(rootDir, "node_modules", ".cache");
if (fs.existsSync(nodeCachePath)) {
  console.log("Removing node_modules/.cache directory...");
  try {
    fs.rmSync(nodeCachePath, { recursive: true, force: true });
    console.log("✅ node_modules/.cache directory removed successfully.");
  } catch (error) {
    console.error(
      "❌ Error removing node_modules/.cache directory:",
      error.message
    );
  }
} else {
  console.log("⚠️ node_modules/.cache directory not found.");
}

// Remove any temporary files that might be causing issues
console.log("Removing temporary files...");
try {
  const tempFilePatterns = [".DS_Store", "*.log", "*.tmp"];
  for (const pattern of tempFilePatterns) {
    if (pattern === ".DS_Store") {
      // Handle .DS_Store files specifically
      try {
        execSync(`find ${rootDir} -name ".DS_Store" -type f -delete`, {
          stdio: "ignore",
        });
      } catch (e) {
        // Ignore errors for this command
      }
    } else {
      try {
        execSync(`find ${rootDir} -name "${pattern}" -type f -delete`, {
          stdio: "ignore",
        });
      } catch (e) {
        // Ignore errors for this command
      }
    }
  }
  console.log("✅ Temporary files removed successfully.");
} catch (error) {
  console.error("❌ Error removing temporary files:", error.message);
}

console.log("✨ Cache clearing complete!");
console.log("👉 Next steps:");
console.log('  - Run "npm run dev" to start the development server');
console.log('  - Or "npm run build" followed by "npm start" for production');
