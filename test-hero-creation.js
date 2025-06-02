const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testHeroCreation() {
  try {
    console.log("🔍 Testing hero slide creation...");

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      return;
    }

    if (!session) {
      console.log("❌ No active session");
      return;
    }

    console.log("✅ User ID:", session.user.id);
    console.log("✅ User email:", session.user.email);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("❌ Profile error:", profileError);
      return;
    }

    console.log("👤 User profile:", profile);

    // Test hero slide creation permission
    const testData = {
      image: "https://example.com/test.jpg",
      title: "Test Slide",
      hero_title: "Test Hero",
      display_order: 999,
      is_editorial: true,
      is_active: false,
    };

    console.log("🚀 Testing hero slide creation with data:", testData);
    const { data, error } = await supabase
      .from("hero_slides")
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error("❌ Hero slide creation error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      console.log("✅ Hero slide created successfully:", data);
      // Clean up test slide
      const { error: deleteError } = await supabase
        .from("hero_slides")
        .delete()
        .eq("id", data.id);

      if (deleteError) {
        console.error("❌ Error cleaning up test slide:", deleteError);
      } else {
        console.log("🧹 Test slide cleaned up");
      }
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

testHeroCreation();
