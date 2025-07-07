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

// Sample spotlight content to create if none exists
const sampleSpotlightContent = {
  id: "sample-spotlight-1",
  title: "Featured Designer Collection",
  subtitle: "Discover exceptional craftsmanship and unique designs",
  brand_name: "EHBS Couture",
  brand_description:
    "A leading fashion house creating timeless pieces that blend contemporary style with traditional African craftsmanship. Each piece tells a story of heritage and innovation.",
  brand_quote:
    "Fashion is art you can wear, and every piece should tell your unique story.",
  brand_quote_author: "EHBS Design Team",
  main_image:
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=800&fit=crop",
  video_url: null, // Will be set if video support is available
  video_thumbnail: null,
  video_type: null,
  video_description: null,
  featured_products: [
    {
      name: "Elegant Evening Dress",
      collection: "Signature Collection",
      image:
        "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=400&h=300&fit=crop",
    },
    {
      name: "Contemporary Blazer",
      collection: "Professional Line",
      image:
        "https://images.unsplash.com/photo-1594736797933-d0acc4d1dd4f?w=400&h=300&fit=crop",
    },
    {
      name: "Cultural Fusion Dress",
      collection: "Heritage Collection",
      image:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=300&fit=crop",
    },
    {
      name: "Statement Accessories",
      collection: "Accessories Line",
      image:
        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=300&fit=crop",
    },
  ],
  brand_link: "/brand/ehbs-couture",
  is_active: true,
};

async function checkAndFixSpotlight() {
  console.log("🔍 Checking Spotlight Section Status...\n");

  try {
    // 1. Check if spotlight_content table exists
    console.log("1. Checking if spotlight_content table exists...");
    const { data: tableCheck, error: tableError } = await supabase
      .from("spotlight_content")
      .select("count(*)")
      .limit(1);

    if (tableError) {
      if (tableError.code === "42P01") {
        console.log("❌ spotlight_content table does not exist");
        console.log("💡 You need to apply the video support migration first:");
        console.log(
          "   Go to Supabase Dashboard > SQL Editor and run the migration from:"
        );
        console.log(
          "   supabase/migrations/20240321000005_add_video_support.sql"
        );
        return;
      } else {
        console.error("❌ Error checking table:", tableError.message);
        return;
      }
    }

    console.log("✅ spotlight_content table exists");

    // 2. Check all spotlight content
    console.log("\n2. Checking existing spotlight content...");
    const { data: allSpotlight, error: allError } = await supabase
      .from("spotlight_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (allError) {
      console.error("❌ Error fetching spotlight content:", allError.message);
      return;
    }

    console.log(`Found ${allSpotlight.length} spotlight content entries`);

    // 3. Check for active spotlight content
    console.log("\n3. Checking for active spotlight content...");
    const { data: activeSpotlight, error: activeError } = await supabase
      .from("spotlight_content")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (activeError) {
      console.error("❌ Error fetching active spotlight:", activeError.message);
      return;
    }

    if (activeSpotlight.length > 0) {
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
      console.log("💡 If not visible, try:");
      console.log(
        "   1. Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+R)"
      );
      console.log("   2. Check browser console for JavaScript errors");
      console.log(
        "   3. Verify you're on the homepage (http://localhost:3000)"
      );
      return;
    }

    // 4. No active spotlight content found - check if we have any content to activate
    if (allSpotlight.length > 0) {
      console.log("❌ No active spotlight content found");
      console.log("\n📋 Available spotlight content:");
      allSpotlight.forEach((item, index) => {
        console.log(
          `   ${index + 1}. ${item.title} (${item.brand_name}) - ${item.is_active ? "ACTIVE" : "INACTIVE"}`
        );
      });

      console.log("\n🔄 Activating the first spotlight content...");
      const { error: updateError } = await supabase
        .from("spotlight_content")
        .update({ is_active: true })
        .eq("id", allSpotlight[0].id);

      if (updateError) {
        console.error(
          "❌ Error activating spotlight content:",
          updateError.message
        );
        return;
      }

      console.log(`✅ Activated: ${allSpotlight[0].title}`);
      console.log("🎉 Spotlight section should now be visible on homepage!");
      return;
    }

    // 5. No spotlight content at all - create sample content
    console.log("❌ No spotlight content found");
    console.log("\n🔄 Creating sample spotlight content...");

    // Check if we have the brand referenced in sample content
    const { data: brandCheck } = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", "ehbs-couture")
      .single();

    if (!brandCheck) {
      // Update brand_link to a generic link if brand doesn't exist
      sampleSpotlightContent.brand_link = "/directory";
      console.log("💡 Brand not found, using generic brand link");
    }

    const { data: newSpotlight, error: createError } = await supabase
      .from("spotlight_content")
      .insert(sampleSpotlightContent)
      .select()
      .single();

    if (createError) {
      console.error(
        "❌ Error creating spotlight content:",
        createError.message
      );

      // Try with a simpler version if the complex one fails
      console.log("\n🔄 Trying with simplified spotlight content...");
      const simpleSpotlight = {
        title: "Featured Designer Collection",
        subtitle: "Discover exceptional craftsmanship",
        brand_name: "Featured Designer",
        brand_description:
          "Creating beautiful, unique pieces for every occasion.",
        brand_quote: "Fashion is art you can wear.",
        brand_quote_author: "Design Team",
        main_image:
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=800&fit=crop",
        featured_products: [],
        brand_link: "/directory",
        is_active: true,
      };

      const { data: simpleResult, error: simpleError } = await supabase
        .from("spotlight_content")
        .insert(simpleSpotlight)
        .select()
        .single();

      if (simpleError) {
        console.error(
          "❌ Error creating simple spotlight content:",
          simpleError.message
        );
        console.log("\n💡 Manual fix needed:");
        console.log("   1. Go to http://localhost:3000/studio/spotlight");
        console.log('   2. Click "Create Spotlight"');
        console.log(
          '   3. Fill in the form and check "Set as active spotlight"'
        );
        return;
      }

      console.log("✅ Created simple spotlight content successfully");
    } else {
      console.log("✅ Created sample spotlight content successfully");
    }

    console.log("\n🎉 Spotlight section should now be visible on homepage!");
    console.log("💡 You may need to refresh your browser to see the changes.");

    // 6. Final verification
    console.log("\n4. Final verification...");
    const { data: finalCheck } = await supabase
      .from("spotlight_content")
      .select("*")
      .eq("is_active", true);

    if (finalCheck && finalCheck.length > 0) {
      console.log(
        `✅ Confirmed: ${finalCheck.length} active spotlight content exists`
      );
      console.log(`   Title: ${finalCheck[0].title}`);
      console.log(`   Brand: ${finalCheck[0].brand_name}`);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    console.log("\n💡 Manual troubleshooting steps:");
    console.log("   1. Check if spotlight_content table exists in Supabase");
    console.log("   2. Apply video support migration if needed");
    console.log("   3. Create spotlight content via Studio UI");
  }
}

checkAndFixSpotlight();
