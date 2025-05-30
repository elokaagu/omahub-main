#!/usr/bin/env node

// This script helps check if your OAuth redirect URLs are correctly configured

// Get the Supabase URL from the environment or use default if testing
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://gswduyodzdgucjscjtvz.supabase.co";

// Display all the URLs that need to be added to Google OAuth configuration
console.log("\n\n=== IMPORTANT: OAuth Configuration Checklist ===\n");
console.log(
  "You MUST add these EXACT redirect URLs to your Google OAuth configuration:"
);
console.log("\n1. Supabase callback URL:");
console.log(`   ${supabaseUrl}/auth/v1/callback`);
console.log("\n2. Production URLs:");
console.log("   https://omahub-main.vercel.app/auth/callback");
console.log("   https://oma-hub.vercel.app/auth/callback");
console.log("\n3. Development URLs (add all of these for local testing):");
console.log("   http://localhost:3000/auth/callback");
console.log("   http://localhost:3001/auth/callback");
console.log("   http://localhost:3002/auth/callback");
console.log("   http://localhost:3003/auth/callback");
console.log(
  '\nMake sure to add ALL OF THESE EXACT URLs to the "Authorized redirect URIs" section in:'
);
console.log(
  "1. Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client ID"
);
console.log(
  "2. Supabase Dashboard > Authentication > Providers > Google > Redirect URL\n"
);
console.log("=== End of Checklist ===\n\n");
