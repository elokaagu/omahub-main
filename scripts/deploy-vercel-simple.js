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
