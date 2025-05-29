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
