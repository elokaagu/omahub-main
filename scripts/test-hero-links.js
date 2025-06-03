const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testHeroLinks() {
  console.log("🧪 Testing hero slide link URLs...");

  try {
    // Get all hero slides
    const { data: slides, error } = await supabase
      .from("hero_slides")
      .select("id, title, link, is_active")
      .order("display_order");

    if (error) {
      console.error("❌ Error fetching hero slides:", error);
      return;
    }

    if (!slides || slides.length === 0) {
      console.log("⚠️ No hero slides found");
      return;
    }

    console.log(`📊 Found ${slides.length} hero slides:`);

    slides.forEach((slide, index) => {
      console.log(`\n${index + 1}. ${slide.title}`);
      console.log(`   ID: ${slide.id}`);
      console.log(`   Link: ${slide.link || "null"}`);
      console.log(`   Active: ${slide.is_active}`);

      // Validate link format
      if (slide.link) {
        const link = slide.link.trim();
        if (link.startsWith("/") || link.startsWith("http")) {
          console.log(`   ✅ Link format is valid`);
        } else {
          console.log(
            `   ⚠️ Link format may need correction (should start with / or http)`
          );
        }
      } else {
        console.log(`   ℹ️ No link specified (will default to /directory)`);
      }
    });

    // Test creating a slide with various link formats
    console.log("\n🔧 Testing link sanitization...");

    const testLinks = [
      "directory?category=Collections",
      "/directory?category=Tailored",
      "https://example.com",
      "  /directory  ",
      "",
      null,
    ];

    testLinks.forEach((testLink) => {
      let sanitizedLink = testLink?.trim() || null;
      if (sanitizedLink) {
        if (
          !sanitizedLink.startsWith("/") &&
          !sanitizedLink.startsWith("http")
        ) {
          sanitizedLink = "/" + sanitizedLink;
        }
        sanitizedLink = sanitizedLink.replace(/\s+/g, "");
      }

      console.log(`Input: "${testLink}" → Output: "${sanitizedLink}"`);
    });

    console.log("\n✅ Hero link testing completed!");
  } catch (error) {
    console.error("❌ Error testing hero links:", error);
  }
}

testHeroLinks();
