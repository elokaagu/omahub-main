const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setup() {
  console.log("Setting up management statistics...");

  try {
    // Insert initial statistics
    const { error } = await supabase.from("management_statistics").upsert([
      { metric_name: "total_brands", metric_value: 0 },
      { metric_name: "verified_brands", metric_value: 0 },
      { metric_name: "active_brands", metric_value: 0 },
      { metric_name: "total_reviews", metric_value: 0 },
      { metric_name: "total_products", metric_value: 0 },
    ]);

    if (error) {
      console.error("Error:", error);
    } else {
      console.log("✅ Management statistics initialized");
    }

    // Update with actual counts
    const { count: brandCount } = await supabase
      .from("brands")
      .select("*", { count: "exact", head: true });

    const { count: reviewCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true });

    await supabase
      .from("management_statistics")
      .update({ metric_value: brandCount || 0 })
      .eq("metric_name", "total_brands");

    await supabase
      .from("management_statistics")
      .update({ metric_value: reviewCount || 0 })
      .eq("metric_name", "total_reviews");

    console.log(
      `Updated counts - Brands: ${brandCount}, Reviews: ${reviewCount}`
    );
  } catch (error) {
    console.error("Setup error:", error);
  }
}

setup();
