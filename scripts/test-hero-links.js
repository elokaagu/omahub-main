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
      "directory",
      "collections",
      "brand/cairo-couture",
      "www.example.com",
      "page#section",
    ];

    testLinks.forEach((testLink, index) => {
      console.log(`\n${index + 1}. Testing: "${testLink}"`);

      // Simulate the sanitization logic from heroService.ts
      let sanitizedLink = testLink?.trim() || null;
      if (sanitizedLink) {
        // Remove any trailing spaces or invalid characters
        sanitizedLink = sanitizedLink.replace(/\s+/g, "");

        // Only add "/" prefix if it's clearly an internal path that needs it
        if (
          sanitizedLink &&
          !sanitizedLink.startsWith("/") &&
          !sanitizedLink.startsWith("http") &&
          !sanitizedLink.includes(".") &&
          !sanitizedLink.includes("?") &&
          !sanitizedLink.includes("#")
        ) {
          // Only add "/" for simple paths like "directory" or "collections"
          sanitizedLink = "/" + sanitizedLink;
        }
      }

      console.log(`   Result: "${sanitizedLink}"`);

      if (testLink === "directory?category=Collections") {
        console.log(`   ✅ Query parameters preserved`);
      } else if (testLink === "directory") {
        console.log(`   ✅ Simple path gets "/" prefix`);
      } else if (testLink === "brand/cairo-couture") {
        console.log(`   ✅ Path with slash preserved`);
      } else if (testLink === "www.example.com") {
        console.log(`   ✅ Domain preserved without prefix`);
      }
    });

    console.log("\n✅ Hero link testing completed!");
  } catch (error) {
    console.error("❌ Error testing hero links:", error);
  }
}

testHeroLinks();
