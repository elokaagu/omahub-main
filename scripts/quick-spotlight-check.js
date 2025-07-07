const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("🔧 Please set your environment variables:");
  console.log('export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"');
  console.log('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpotlightStatus() {
  try {
    console.log("🔍 Checking spotlight content...");

    // Check if table exists
    const { data: tables, error: tablesError } = await supabase
      .from("spotlight_content")
      .select("*")
      .limit(1);

    if (tablesError) {
      console.log(
        "❌ Table does not exist or has issues:",
        tablesError.message
      );
      return;
    }

    // Check all spotlight content
    const { data: allSpotlight, error: allError } = await supabase
      .from("spotlight_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (allError) {
      console.log("❌ Error fetching spotlight content:", allError.message);
      return;
    }

    console.log(`📊 Total spotlight content: ${allSpotlight?.length || 0}`);

    if (allSpotlight && allSpotlight.length > 0) {
      console.log("📋 All spotlight content:");
      allSpotlight.forEach((item, index) => {
        console.log(
          `  ${index + 1}. ${item.title} (Active: ${item.is_active})`
        );
      });

      // Check active content
      const activeContent = allSpotlight.filter((item) => item.is_active);
      console.log(`✅ Active spotlight content: ${activeContent.length}`);

      if (activeContent.length === 0) {
        console.log(
          "🔧 No active spotlight content found. Activating the first one..."
        );

        const { data: updated, error: updateError } = await supabase
          .from("spotlight_content")
          .update({ is_active: true })
          .eq("id", allSpotlight[0].id)
          .select()
          .single();

        if (updateError) {
          console.log("❌ Error activating spotlight:", updateError.message);
        } else {
          console.log("✅ Successfully activated:", updated.title);
        }
      }
    } else {
      console.log("📝 No spotlight content found. Creating sample content...");

      const sampleSpotlight = {
        title: "Featured Designer",
        subtitle: "Discover exceptional craftsmanship",
        brand_name: "Elegant Couture",
        brand_description:
          "Specializing in bespoke evening wear and bridal collections with over 10 years of experience in luxury fashion.",
        brand_quote:
          "Fashion is about expressing your unique story through timeless elegance",
        brand_quote_author: "Sarah Johnson, Creative Director",
        main_image: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
        video_url: null,
        video_thumbnail: null,
        video_type: null,
        video_description: null,
        featured_products: [
          {
            name: "Evening Gown",
            collection: "Midnight Collection",
            image: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
          },
          {
            name: "Cocktail Dress",
            collection: "Urban Chic",
            image: "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
          },
        ],
        brand_link: "/brand/elegant-couture",
        is_active: true,
      };

      const { data: created, error: createError } = await supabase
        .from("spotlight_content")
        .insert(sampleSpotlight)
        .select()
        .single();

      if (createError) {
        console.log(
          "❌ Error creating spotlight content:",
          createError.message
        );
      } else {
        console.log(
          "✅ Successfully created spotlight content:",
          created.title
        );
      }
    }

    console.log("🎯 Spotlight check complete!");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkSpotlightStatus();
