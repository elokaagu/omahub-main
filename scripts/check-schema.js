const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    console.log("🔍 Checking database schema...");

    // Check brands table structure
    console.log("\n📋 Brands table sample:");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("*")
      .limit(3);

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
    } else {
      console.log(brands);
    }

    // Check profiles table structure
    console.log("\n📋 Profiles table sample:");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(3);

    if (profilesError) {
      console.error("❌ Error fetching profiles:", profilesError);
    } else {
      console.log(profiles);
    }

    // Check specifically for eloka@culturin.com
    console.log("\n🔍 Checking eloka@culturin.com profile:");
    const { data: elokaProfile, error: elokaError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "eloka@culturin.com")
      .single();

    if (elokaError) {
      console.error("❌ Error fetching eloka profile:", elokaError);
    } else {
      console.log(elokaProfile);
    }

    // Check for Ehbs Couture specifically
    console.log("\n🔍 Checking Ehbs Couture brand:");
    const { data: ehbsBrand, error: ehbsError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", "ehbs-couture")
      .single();

    if (ehbsError) {
      console.error("❌ Error fetching Ehbs Couture:", ehbsError);
    } else {
      console.log(ehbsBrand);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
checkSchema();
