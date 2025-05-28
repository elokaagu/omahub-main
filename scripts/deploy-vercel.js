#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting Vercel deployment process...");

// Run the fix-animations script
console.log("🔧 Running animations fix...");
require("./fix-animations");

// Update the .env file for deployment
console.log("📝 Setting up environment variables...");
try {
  // Create a .env.local file with NEXT_PUBLIC variables for deployment
  const envContent = `
NEXT_PUBLIC_SUPABASE_URL=${
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://gswduyodzdgucjscjtvz.supabase.co"
  }
NEXT_PUBLIC_SUPABASE_ANON_KEY=${
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.gEREBStwiffbTmAaZGmBBsXo4FYEqQat8TpT46sS60A"
  }
NEXT_IGNORE_TYPESCRIPT_ERRORS=true
NEXT_IGNORE_ESM_VALIDATE=true
VERCEL_BUILD_STEP=true
  `;

  fs.writeFileSync(path.join(process.cwd(), ".env.production"), envContent);
  console.log("✅ Environment variables set up successfully");
} catch (error) {
  console.error("❌ Error setting up environment variables:", error);
}

// Run the deployment
console.log("🚀 Deploying to Vercel...");
try {
  execSync("vercel --prod", {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        "https://gswduyodzdgucjscjtvz.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.gEREBStwiffbTmAaZGmBBsXo4FYEqQat8TpT46sS60A",
      NEXT_IGNORE_TYPESCRIPT_ERRORS: "true",
      NEXT_IGNORE_ESM_VALIDATE: "true",
      VERCEL_BUILD_STEP: "true",
      CI: "false",
      NODE_OPTIONS: "--no-warnings --max-old-space-size=4096",
    },
  });
  console.log("✅ Deployment completed successfully!");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
}
