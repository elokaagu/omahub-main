#!/usr/bin/env node

// This script helps diagnose Supabase configuration issues
const dotenv = require("dotenv");

// Load environment variables from .env.local if it exists
try {
  dotenv.config({ path: ".env.local" });
} catch (error) {
  console.log("No .env.local file found, using environment variables");
}

// Get Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

console.log("\n=== SUPABASE CONFIGURATION CHECKER ===\n");

// Check for presence of environment variables
if (!supabaseUrl) {
  console.log("❌ NEXT_PUBLIC_SUPABASE_URL is missing or empty");
} else {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
}

if (!supabaseKey) {
  console.log("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty");
} else {
  console.log(
    `✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 10)}...`
  );
}

console.log("\n=== SUPABASE SITE URL CONFIGURATION ===\n");
console.log(
  "IMPORTANT: In the Supabase Dashboard, make sure to set these Site URLs:"
);
console.log("1. Go to Authentication > URL Configuration");
console.log("2. Add the following Site URLs:");
console.log("   - https://omahub-main.vercel.app");
console.log("   - http://localhost:3000");
console.log("   - http://localhost:3001");
console.log("   - http://localhost:3002");
console.log("   - http://localhost:3003");
console.log("\n3. Add the following Redirect URLs:");
console.log("   - https://omahub-main.vercel.app/auth/callback");
console.log("   - http://localhost:3000/auth/callback");
console.log("   - http://localhost:3001/auth/callback");
console.log("   - http://localhost:3002/auth/callback");
console.log("   - http://localhost:3003/auth/callback");

console.log("\n=== RECOMMENDED STEPS ===\n");
console.log("1. Go to the Supabase Dashboard: https://app.supabase.com/");
console.log("2. Select your project");
console.log("3. Navigate to Authentication > Providers");
console.log("4. Configure email authentication settings");
console.log("5. Navigate to Authentication > URL Configuration");
console.log("6. Set the Site URLs and Redirect URLs as listed above");
console.log("\n=== END OF CHECKER ===\n");
