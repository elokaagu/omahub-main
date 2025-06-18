const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInboxSystem() {
  console.log("🔍 Checking inbox system database tables...\n");

  try {
    // Check if inquiries table exists
    console.log("1️⃣ Checking inquiries table...");
    const { data: inquiriesData, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("count", { count: "exact", head: true });

    if (inquiriesError) {
      console.log("❌ inquiries table:", inquiriesError.message);
    } else {
      console.log(
        "✅ inquiries table exists with",
        inquiriesData?.length || 0,
        "records"
      );
    }

    // Check if inquiry_replies table exists
    console.log("2️⃣ Checking inquiry_replies table...");
    const { data: repliesData, error: repliesError } = await supabase
      .from("inquiry_replies")
      .select("count", { count: "exact", head: true });

    if (repliesError) {
      console.log("❌ inquiry_replies table:", repliesError.message);
    } else {
      console.log(
        "✅ inquiry_replies table exists with",
        repliesData?.length || 0,
        "records"
      );
    }

    // Check if inquiries_with_details view exists
    console.log("3️⃣ Checking inquiries_with_details view...");
    const { data: viewData, error: viewError } = await supabase
      .from("inquiries_with_details")
      .select("count", { count: "exact", head: true });

    if (viewError) {
      console.log("❌ inquiries_with_details view:", viewError.message);
    } else {
      console.log(
        "✅ inquiries_with_details view exists with",
        viewData?.length || 0,
        "records"
      );
    }

    // Check if get_inbox_stats function exists
    console.log("4️⃣ Checking get_inbox_stats function...");
    const { data: statsData, error: statsError } = await supabase.rpc(
      "get_inbox_stats",
      { admin_user_id: "test" }
    );

    if (statsError) {
      console.log("❌ get_inbox_stats function:", statsError.message);
    } else {
      console.log("✅ get_inbox_stats function exists");
    }

    console.log("\n🎯 Summary:");
    console.log(
      "- If any tables/views are missing, run: scripts/create-studio-inbox-system.sql"
    );
    console.log("- Make sure you have proper database permissions");
    console.log(
      "- Check your .env.local file for correct Supabase credentials"
    );
  } catch (error) {
    console.error("💥 Error checking inbox system:", error.message);
  }
}

checkInboxSystem();
