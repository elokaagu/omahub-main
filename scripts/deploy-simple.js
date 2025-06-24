const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🚀 Starting simplified deployment process...");

// Clear build cache
console.log("🧹 Clearing Next.js cache...");
try {
  const nextDir = path.join(process.cwd(), ".next");
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("✅ .next directory removed successfully.");
  }

  const cacheDir = path.join(process.cwd(), "node_modules", ".cache");
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log("✅ node_modules/.cache directory removed successfully.");
  }
} catch (error) {
  console.error("❌ Error clearing cache:", error);
}

// Build the project
console.log("🔨 Building the project...");
try {
  // Run fix-animations script first
  console.log("🛠️ Running fix-animations script...");
  execSync("node scripts/fix-animations.js", { stdio: "inherit" });

  // Then build the project
  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_OPTIONS: "--no-warnings --max-old-space-size=4096",
      CI: "false",
    },
  });
  console.log("✅ Build completed successfully!");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}

// Deploy to Vercel
console.log("🚀 Deploying to Vercel...");
try {
  execSync("npx vercel --prod", {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  console.log("✅ Deployment completed successfully!");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
}
