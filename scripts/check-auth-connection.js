// Quick diagnostic script to check Supabase auth connection
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function checkAuthConnection() {
  console.log("🔍 Checking Supabase Auth Connection...\n");

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log("Environment Variables:");
  console.log(`✅ Supabase URL: ${supabaseUrl ? "Set" : "Missing"}`);
  console.log(`✅ Supabase Key: ${supabaseKey ? "Set" : "Missing"}`);

  if (!supabaseUrl || !supabaseKey) {
    console.log("\n❌ Missing environment variables!");
    console.log("Please check your .env.local file");
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("\n🔄 Testing Supabase connection...");

    // Test basic connection
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (error) {
      console.log("❌ Database connection failed:", error.message);
    } else {
      console.log("✅ Database connection successful!");
    }

    // Test auth methods
    console.log("\n🔄 Testing auth methods...");
    const { data: authData, error: authError } =
      await supabase.auth.getSession();

    if (authError) {
      console.log("❌ Auth connection failed:", authError.message);
    } else {
      console.log("✅ Auth connection successful!");
      console.log("Session:", authData.session ? "Available" : "None");
    }
  } catch (error) {
    console.log("❌ Connection test failed:", error.message);
  }
}

checkAuthConnection();
