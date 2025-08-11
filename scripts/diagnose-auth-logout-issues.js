// Diagnose Authentication Logout Issues
// This script investigates why users are getting logged out on page refresh

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function diagnoseAuthLogoutIssues() {
  console.log("🔍 Diagnosing Authentication Logout Issues...\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Missing environment variables!");
    console.log("Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Step 1: Check Supabase client configuration...");
    console.log(`  Supabase URL: ${supabaseUrl}`);
    console.log(`  Supabase Key: ${supabaseKey.substring(0, 20)}...`);
    
    // Check if we're in browser environment
    if (typeof window !== "undefined") {
      console.log("  Environment: Browser");
      
      // Check localStorage for auth tokens
      console.log("\n🔄 Step 2: Check browser storage for auth tokens...");
      const storageKeys = Object.keys(localStorage);
      const authKeys = storageKeys.filter(key => 
        key.includes('sb-') || 
        key.includes('auth') || 
        key.includes('supabase')
      );
      
      if (authKeys.length > 0) {
        console.log("  Found auth-related localStorage keys:");
        authKeys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (parsed.access_token) {
                console.log(`    ${key}: Has access token (${parsed.access_token.substring(0, 20)}...)`);
              } else {
                console.log(`    ${key}: No access token`);
              }
            }
          } catch (e) {
            console.log(`    ${key}: Invalid JSON`);
          }
        });
      } else {
        console.log("  No auth-related localStorage keys found");
      }

      // Check sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      const sessionAuthKeys = sessionKeys.filter(key => 
        key.includes('sb-') || 
        key.includes('auth') || 
        key.includes('supabase')
      );
      
      if (sessionAuthKeys.length > 0) {
        console.log("  Found auth-related sessionStorage keys:");
        sessionAuthKeys.forEach(key => {
          console.log(`    ${key}`);
        });
      } else {
        console.log("  No auth-related sessionStorage keys found");
      }

      // Check cookies
      console.log("\n🔄 Step 3: Check cookies for auth tokens...");
      const cookies = document.cookie.split(';');
      const authCookies = cookies.filter(cookie => 
        cookie.includes('sb-') || 
        cookie.includes('auth') || 
        cookie.includes('supabase')
      );
      
      if (authCookies.length > 0) {
        console.log("  Found auth-related cookies:");
        authCookies.forEach(cookie => {
          console.log(`    ${cookie.trim()}`);
        });
      } else {
        console.log("  No auth-related cookies found");
      }

    } else {
      console.log("  Environment: Node.js (server-side)");
    }

    console.log("\n🔄 Step 4: Test Supabase client functionality...");
    
    // Test basic client functionality
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log(`  ❌ Error getting session: ${error.message}`);
      } else if (session) {
        console.log(`  ✅ Session found: ${session.user.email}`);
        console.log(`    User ID: ${session.user.id}`);
        console.log(`    Access Token: ${session.access_token.substring(0, 20)}...`);
        console.log(`    Refresh Token: ${session.refresh_token.substring(0, 20)}...`);
        console.log(`    Expires At: ${new Date(session.expires_at * 1000).toISOString()}`);
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at < now) {
          console.log("  ⚠️  Session token is expired!");
        } else {
          console.log("  ✅ Session token is valid");
        }
      } else {
        console.log("  ℹ️  No active session found");
      }
    } catch (sessionError) {
      console.log(`  ❌ Session check failed: ${sessionError.message}`);
    }

    console.log("\n🔄 Step 5: Check for common logout causes...");
    
    // Check if we can identify the issue
    if (typeof window !== "undefined") {
      const issues = [];
      
      // Check for multiple Supabase clients
      if (window.__SUPABASE_CLIENTS__ && window.__SUPABASE_CLIENTS__.length > 1) {
        issues.push("Multiple Supabase clients detected - this can cause session conflicts");
      }
      
      // Check for storage quota issues
      try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          issues.push("LocalStorage quota exceeded - this can cause auth data loss");
        }
      }
      
      // Check for browser privacy settings
      if (navigator.cookieEnabled === false) {
        issues.push("Cookies are disabled - this will prevent session persistence");
      }
      
      if (issues.length > 0) {
        console.log("  🚨 Potential issues found:");
        issues.forEach(issue => console.log(`    - ${issue}`));
      } else {
        console.log("  ✅ No obvious issues detected");
      }
    }

    console.log("\n🔄 Step 6: Recommendations...");
    console.log("  📋 To fix logout issues:");
    console.log("    1. Check browser console for errors during page refresh");
    console.log("    2. Verify localStorage and sessionStorage are not being cleared");
    console.log("    3. Ensure only one Supabase client instance is created");
    console.log("    4. Check if browser extensions are interfering with storage");
    console.log("    5. Verify cookies are enabled and not being blocked");
    console.log("    6. Check for network errors during session refresh");

  } catch (error) {
    console.error("❌ Diagnosis failed:", error.message);
  }
}

// Run the diagnosis
diagnoseAuthLogoutIssues();
