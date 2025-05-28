const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🚀 Starting Vercel deployment process...");

// Ensure the build directory is clean
console.log("🧹 Cleaning build cache...");
try {
  if (fs.existsSync(path.join(process.cwd(), ".next"))) {
    fs.rmSync(path.join(process.cwd(), ".next"), {
      recursive: true,
      force: true,
    });
    console.log("✅ .next directory removed successfully.");
  }
} catch (error) {
  console.error("❌ Error cleaning .next directory:", error);
}

// Build locally first to ensure it works
console.log("📦 Building locally first...");
try {
  execSync("npm run build", {
    stdio: "inherit",
    env: {
      ...process.env,
      VERCEL_BUILD_STEP: "true",
      CI: "false",
      NODE_OPTIONS: "--no-warnings --max-old-space-size=4096",
    },
  });
  console.log("✅ Local build successful.");
} catch (error) {
  console.error("❌ Local build failed:", error.message);
  process.exit(1);
}

// Set required environment variables
process.env.VERCEL_BUILD_STEP = "true";
process.env.CI = "false";
process.env.NODE_OPTIONS = "--no-warnings --max-old-space-size=4096";

console.log("🔧 Setting up environment for deployment...");

try {
  // Deploy using a custom Vercel command with override build command
  console.log("📦 Running Vercel deployment...");
  execSync(
    'npx vercel --prod --build-env VERCEL_BUILD_STEP=true --build-env CI=false --build-env NODE_OPTIONS="--no-warnings"',
    {
      stdio: "inherit",
      env: {
        ...process.env,
        VERCEL_BUILD_STEP: "true",
        CI: "false",
        NODE_OPTIONS: "--no-warnings --max-old-space-size=4096",
      },
    }
  );

  console.log("✅ Deployment command completed.");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
}
