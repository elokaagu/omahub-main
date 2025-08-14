const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkBrandsFolder() {
  try {
    console.log("🔍 Checking brands folder in brand-assets bucket...");

    // Check the brands folder
    const { data: brandsFiles, error: brandsError } = await supabase.storage
      .from("brand-assets")
      .list("brands", { limit: 1000 });

    if (brandsError) {
      console.error("❌ Error listing brands folder:", brandsError);
      return;
    }

    console.log(`Found ${brandsFiles.length} files in brands folder:`);

    if (brandsFiles.length === 0) {
      console.log("📁 Brands folder is empty");
      return;
    }

    // Show all files
    brandsFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name}`);
      if (file.metadata) {
        console.log(`     Size: ${file.metadata.size} bytes`);
        console.log(`     MIME: ${file.metadata.mimetype}`);
      }
    });

    // Check collections folder too
    console.log("\n🔍 Checking collections folder...");
    const { data: collectionsFiles, error: collectionsError } =
      await supabase.storage
        .from("brand-assets")
        .list("collections", { limit: 1000 });

    if (collectionsError) {
      console.error("❌ Error listing collections folder:", collectionsError);
    } else {
      console.log(
        `Found ${collectionsFiles.length} files in collections folder:`
      );

      if (collectionsFiles.length > 0) {
        collectionsFiles.slice(0, 10).forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.name}`);
          if (file.metadata) {
            console.log(`     Size: ${file.metadata.size} bytes`);
          }
        });

        if (collectionsFiles.length > 10) {
          console.log(`  ... and ${collectionsFiles.length - 10} more`);
        }
      }
    }

    // Check portfolio folder
    console.log("\n🔍 Checking portfolio folder...");
    const { data: portfolioFiles, error: portfolioError } =
      await supabase.storage
        .from("brand-assets")
        .list("portfolio", { limit: 1000 });

    if (portfolioError) {
      console.error("❌ Error listing portfolio folder:", portfolioError);
    } else {
      console.log(`Found ${portfolioFiles.length} files in portfolio folder:`);

      if (portfolioFiles.length > 0) {
        portfolioFiles.slice(0, 10).forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.name}`);
          if (file.metadata) {
            console.log(`     Size: ${file.metadata.size} bytes`);
          }
        });

        if (portfolioFiles.length > 10) {
          console.log(`  ... and ${portfolioFiles.length - 10} more`);
        }
      }
    }

    console.log("\n🎯 Summary:");
    console.log(
      "These organized folders likely contain your original brand images."
    );
    console.log(
      "The images in the root of brand-assets are probably temporary uploads."
    );
  } catch (error) {
    console.error("❌ Error in checkBrandsFolder:", error);
  }
}

// Run the check
checkBrandsFolder()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
