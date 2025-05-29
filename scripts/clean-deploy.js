const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting minimal clean deployment process...");

// Step 1: Clear Next.js cache
console.log("🧹 Clearing Next.js cache...");
try {
  if (fs.existsSync(".next")) {
    fs.rmSync(".next", { recursive: true, force: true });
    console.log("✅ .next directory removed successfully.");
  } else {
    console.log("ℹ️ No .next directory found, skipping cache clear.");
  }
} catch (error) {
  console.error("❌ Error clearing Next.js cache:", error);
}

// Step 2: Deploy to Vercel with minimal configuration
console.log("🚀 Deploying to Vercel with minimal configuration...");
try {
  // Use a minimal deployment approach
  execSync("npx vercel --prod --no-clipboard", { stdio: "inherit" });
  console.log("✅ Deployment initiated successfully!");
} catch (error) {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
}
