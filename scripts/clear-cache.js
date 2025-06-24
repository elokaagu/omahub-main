#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🧹 Clearing Next.js cache...");
console.log("Current working directory:", process.cwd());

// Remove .next directory
try {
  const nextDir = path.join(process.cwd(), ".next");
  console.log("Checking for .next directory at:", nextDir);

  if (fs.existsSync(nextDir)) {
    console.log("Removing .next directory...");
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("✅ .next directory removed successfully.");
  } else {
    console.log("⚠️ .next directory not found.");
  }
} catch (error) {
  console.error("❌ Error removing .next directory:", error);
}

// Remove node_modules/.cache directory
try {
  const cacheDir = path.join(process.cwd(), "node_modules", ".cache");
  console.log("Checking for node_modules/.cache directory at:", cacheDir);

  if (fs.existsSync(cacheDir)) {
    console.log("Removing node_modules/.cache directory...");
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log("✅ node_modules/.cache directory removed successfully.");
  } else {
    console.log("⚠️ node_modules/.cache directory not found.");
  }
} catch (error) {
  console.error("❌ Error removing node_modules/.cache directory:", error);
}

// Remove temporary files
try {
  console.log("Removing temporary files...");
  const tempFiles = [
    path.join(process.cwd(), ".vercel", "output"),
    path.join(process.cwd(), ".vercel", "build-output"),
  ];

  for (const file of tempFiles) {
    if (fs.existsSync(file)) {
      fs.rmSync(file, { recursive: true, force: true });
    }
  }
  console.log("✅ Temporary files removed successfully.");
} catch (error) {
  console.error("❌ Error removing temporary files:", error);
}

console.log("✨ Cache clearing complete!");
console.log("👉 Next steps:");
console.log('  - Run "npm run dev" to start the development server');
console.log('  - Or "npm run build" followed by "npm start" for production');
