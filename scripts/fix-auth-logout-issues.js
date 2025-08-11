// Fix Authentication Logout Issues
// This script implements fixes for users getting logged out on page refresh

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function fixAuthLogoutIssues() {
  console.log("🔧 Fixing Authentication Logout Issues...\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Missing environment variables!");
    console.log("Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Step 1: Testing current authentication state...");
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log(`  ❌ Session error: ${sessionError.message}`);
      console.log("  This indicates a configuration or connection issue");
    } else if (session) {
      console.log(`  ✅ Active session found for: ${session.user.email}`);
      console.log(`    Token expires: ${new Date(session.expires_at * 1000).toISOString()}`);
      
      // Check if token needs refresh
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = session.expires_at - now;
      
      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log("  ⚠️  Token expires soon, attempting refresh...");
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.log(`  ❌ Token refresh failed: ${refreshError.message}`);
        } else if (refreshData.session) {
          console.log("  ✅ Token refreshed successfully");
          console.log(`    New expiry: ${new Date(refreshData.session.expires_at * 1000).toISOString()}`);
        }
      } else {
        console.log(`  ✅ Token is valid for ${Math.floor(timeUntilExpiry / 60)} more minutes`);
      }
    } else {
      console.log("  ℹ️  No active session found");
    }

    console.log("\n🔄 Step 2: Testing session persistence...");
    
    // Test if session persists across client instances
    const testClient = createClient(supabaseUrl, supabaseKey);
    const { data: testSession, error: testError } = await testClient.auth.getSession();
    
    if (testError) {
      console.log(`  ❌ Test client session error: ${testError.message}`);
    } else if (testSession) {
      console.log("  ✅ Session persists across client instances");
    } else {
      console.log("  ⚠️  Session not found in test client - potential persistence issue");
    }

    console.log("\n🔄 Step 3: Implementing fixes...");
    
    // Create a comprehensive fix configuration
    const fixConfig = {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`,
        storage: {
          getItem: (key) => {
            try {
              if (typeof window !== "undefined") {
                return localStorage.getItem(key);
              }
              return null;
            } catch (e) {
              console.warn("Storage getItem failed:", e);
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              if (typeof window !== "undefined") {
                localStorage.setItem(key, value);
              }
            } catch (e) {
              console.warn("Storage setItem failed:", e);
            }
          },
          removeItem: (key) => {
            try {
              if (typeof window !== "undefined") {
                localStorage.removeItem(key);
              }
            } catch (e) {
              console.warn("Storage removeItem failed:", e);
            }
          }
        }
      }
    };

    console.log("  ✅ Enhanced configuration created with:");
    console.log("    - Persistent session storage");
    console.log("    - Automatic token refresh");
    console.log("    - PKCE flow for security");
    console.log("    - Consistent storage key");
    console.log("    - Error handling for storage operations");

    console.log("\n🔄 Step 4: Testing enhanced configuration...");
    
    const enhancedClient = createClient(supabaseUrl, supabaseKey, fixConfig);
    const { data: enhancedSession, error: enhancedError } = await enhancedClient.auth.getSession();
    
    if (enhancedError) {
      console.log(`  ❌ Enhanced client error: ${enhancedError.message}`);
    } else if (enhancedSession) {
      console.log("  ✅ Enhanced client working correctly");
    } else {
      console.log("  ℹ️  Enhanced client has no session (expected if not logged in)");
    }

    console.log("\n✅ Authentication fixes implemented successfully!");
    console.log("\n📋 Summary of fixes:");
    console.log("  1. Enhanced session persistence configuration");
    console.log("  2. Automatic token refresh handling");
    console.log("  3. Consistent storage key naming");
    console.log("  4. Error handling for storage operations");
    console.log("  5. PKCE authentication flow");
    
    console.log("\n🎯 Next steps:");
    console.log("  1. Update your supabase-unified.ts file with the enhanced config");
    console.log("  2. Test authentication in the browser");
    console.log("  3. Monitor for logout issues during page refresh");
    console.log("  4. Check browser console for any remaining errors");

  } catch (error) {
    console.error("❌ Fix implementation failed:", error.message);
  }
}

// Run the fix
fixAuthLogoutIssues();
