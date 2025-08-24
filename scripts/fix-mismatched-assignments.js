require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

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

async function fixMismatchedAssignments() {
  try {
    console.log("🔧 Fixing mismatched brand image assignments...");
    console.log("======================================================================");

    // Step 1: Get all assignments
    console.log("\n📋 Step 1: Fetching all assignments...");
    const { data: assignments, error: assignmentsError } = await supabase
      .from("brand_image_assignments")
      .select("*")
      .order("brand_id");

    if (assignmentsError) {
      console.error("❌ Error fetching assignments:", assignmentsError);
      return;
    }

    console.log(`✅ Found ${assignments.length} assignments`);

    // Step 2: Get all brands
    console.log("\n📋 Step 2: Fetching all brands...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`✅ Found ${brands.length} brands`);

    // Step 3: Create brand map for quick lookup
    const brandMap = new Map(brands.map((b) => [b.id, b]));

    // Step 4: Identify and fix mismatches
    console.log("\n🔍 Step 3: Identifying and fixing mismatches...");
    
    let fixedCount = 0;
    let errorCount = 0;
    const mismatches = [];

    for (const assignment of assignments) {
      const brand = brandMap.get(assignment.brand_id);
      if (!brand) continue;

      const currentImageUrl = brand.image;
      const currentFilename = currentImageUrl
        ? currentImageUrl.split("/").pop()
        : null;
      const expectedFilename = assignment.image_filename;

      // Check if there's a mismatch
      if (currentFilename !== expectedFilename) {
        mismatches.push({
          brand: brand.name,
          expected: expectedFilename,
          actual: currentFilename,
          assignment: assignment,
        });

        console.log(`\n🔧 Fixing mismatch for ${brand.name}:`);
        console.log(`   Expected: ${expectedFilename}`);
        console.log(`   Current: ${currentFilename}`);

        // Create the correct image URL
        const correctImageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${expectedFilename}`;
        console.log(`   New URL: ${correctImageUrl}`);

        // Update the brand's image
        const { error: updateError } = await supabase
          .from("brands")
          .update({ image: correctImageUrl })
          .eq("id", brand.id);

        if (updateError) {
          console.error(`   ❌ Failed to update ${brand.name}:`, updateError);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully updated ${brand.name}`);
          fixedCount++;
        }
      }
    }

    // Step 5: Display results
    console.log("\n📊 Step 4: Results...");
    console.log(`✅ Fixed mismatches: ${fixedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (mismatches.length > 0) {
      console.log(`\n🔍 Mismatches found and fixed:`);
      mismatches.forEach((mismatch) => {
        console.log(`   - ${mismatch.brand}: ${mismatch.actual} → ${mismatch.expected}`);
      });
    } else {
      console.log("✅ No mismatches found!");
    }

    // Step 6: Verify the fixes
    console.log("\n🔍 Step 5: Verifying fixes...");
    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("id, name, image")
      .order("name");

    if (verifyError) {
      console.error("❌ Error verifying brands:", verifyError);
    } else {
      console.log("✅ Verification completed");
    }

    console.log("\n======================================================================");
    console.log("🎯 Brand image mismatch fixes completed!");
    console.log(`📊 Summary: ${fixedCount} mismatches fixed, ${errorCount} errors`);
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
fixMismatchedAssignments();
