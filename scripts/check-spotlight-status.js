const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.log("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpotlightStatus() {
  console.log("🔍 Checking Spotlight Status...\n");

  try {
    // 1. Check if spotlight_content table exists and has data
    console.log("1. Checking spotlight_content table...");
    const { data: allSpotlight, error: allError } = await supabase
      .from("spotlight_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (allError) {
      console.error("❌ Error fetching spotlight content:", allError.message);
      if (allError.code === "42P01") {
        console.log("💡 The spotlight_content table does not exist.");
        console.log("   You need to run the video support migration first.");
        return;
      }
      return;
    }

    console.log(`✅ Found ${allSpotlight.length} spotlight content entries`);

    if (allSpotlight.length === 0) {
      console.log("\n🎯 SOLUTION: No spotlight content found");
      console.log("   • Go to http://localhost:3000/studio/spotlight");
      console.log('   • Click "Create Spotlight"');
      console.log('   • Fill in the form and check "Set as active spotlight"');
      console.log("   • Save to see the spotlight section on homepage");
      return;
    }

    // 2. Check for active spotlight content
    console.log("\n2. Checking for active spotlight content...");
    const { data: activeSpotlight, error: activeError } = await supabase
      .from("spotlight_content")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (activeError) {
      console.error("❌ Error fetching active spotlight:", activeError.message);
      return;
    }

    if (activeSpotlight.length === 0) {
      console.log("❌ No active spotlight content found");
      console.log("\n📋 Available spotlight content:");
      allSpotlight.forEach((item, index) => {
        console.log(
          `   ${index + 1}. ${item.title} (${item.brand_name}) - ${item.is_active ? "ACTIVE" : "INACTIVE"}`
        );
      });
      console.log("\n🎯 SOLUTION: Activate existing spotlight content");
      console.log("   • Go to http://localhost:3000/studio/spotlight");
      console.log('   • Click "Activate" on any spotlight content');
      console.log(
        '   • Or create new content with "Set as active spotlight" checked'
      );
    } else {
      console.log(
        `✅ Found ${activeSpotlight.length} active spotlight content`
      );
      const active = activeSpotlight[0];
      console.log(`   Title: ${active.title}`);
      console.log(`   Brand: ${active.brand_name}`);
      console.log(`   Has Video: ${active.video_url ? "Yes" : "No"}`);
      console.log(
        `   Created: ${new Date(active.created_at).toLocaleDateString()}`
      );

      console.log("\n✅ Spotlight section should be visible on homepage!");
      console.log("   If not visible, check browser console for errors.");
    }

    // 3. Check database columns
    console.log("\n3. Checking database structure...");
    const { data: columns, error: columnError } = await supabase
      .rpc("get_table_columns", { table_name: "spotlight_content" })
      .then((result) => result.data)
      .catch(() => null);

    if (columns) {
      const hasVideoColumns = columns.some(
        (col) => col.column_name === "video_url"
      );
      console.log(
        `   Video support: ${hasVideoColumns ? "✅ Enabled" : "❌ Missing"}`
      );
      if (!hasVideoColumns) {
        console.log(
          "   💡 Run the video support migration to enable video uploads"
        );
      }
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Helper function to get table columns (if available)
async function getTableColumns() {
  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_name", "spotlight_content");

  return data || [];
}

checkSpotlightStatus();
