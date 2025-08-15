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

async function verifyBrandImageAssociations() {
  try {
    console.log("🔍 Verifying brand image associations...");
    console.log("=".repeat(70));

    // 1. Check if the associations table exists
    console.log("\n📋 Step 1: Checking associations table...");

    const { data: tableCheck, error: tableError } = await supabase
      .from("brand_image_assignments")
      .select("count")
      .limit(1);

    if (tableError) {
      console.error(
        "❌ Associations table doesn't exist. Run create-brand-image-associations-table.js first!"
      );
      return;
    }

    console.log("✅ Associations table exists");

    // 2. Get all brand-image assignments
    console.log("\n📊 Step 2: Fetching all assignments...");

    const { data: assignments, error: assignmentsError } = await supabase
      .from("brand_image_assignments")
      .select(
        `
        id,
        brand_id,
        image_filename,
        image_url,
        is_verified,
        assigned_at,
        verification_notes
      `
      )
      .order("assigned_at");

    if (assignmentsError) {
      console.error("❌ Error fetching assignments:", assignmentsError);
      return;
    }

    console.log(`📋 Found ${assignments.length} assignments`);

    // 3. Get brand details for each assignment
    console.log("\n🔍 Step 3: Analyzing assignments...");

    const brandIds = [...new Set(assignments.map((a) => a.brand_id))];
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .in("id", brandIds);

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    const brandMap = new Map(brands.map((b) => [b.id, b]));

    // 4. Check for mismatches and issues
    console.log("\n⚠️  Step 4: Identifying issues...");

    const issues = [];
    const verifiedAssignments = [];
    const unverifiedAssignments = [];

    for (const assignment of assignments) {
      const brand = brandMap.get(assignment.brand_id);
      if (!brand) continue;

      const currentImageUrl = brand.image;
      const currentFilename = currentImageUrl
        ? currentImageUrl.split("/").pop()
        : null;

      // Check if assignment matches current brand image
      const isCurrent = currentFilename === assignment.image_filename;

      if (assignment.is_verified) {
        verifiedAssignments.push({ assignment, brand, isCurrent });
      } else {
        unverifiedAssignments.push({ assignment, brand, isCurrent });
      }

      // Identify specific issues
      if (!isCurrent) {
        issues.push({
          type: "MISMATCH",
          brand: brand.name,
          expected: assignment.image_filename,
          actual: currentFilename,
          assignment: assignment,
        });
      }

      if (!assignment.is_verified) {
        issues.push({
          type: "UNVERIFIED",
          brand: brand.name,
          filename: assignment.image_filename,
          assignment: assignment,
        });
      }
    }

    // 5. Display results
    console.log("\n📊 Step 5: Analysis results...");

    console.log(`\n✅ Verified assignments: ${verifiedAssignments.length}`);
    verifiedAssignments
      .slice(0, 5)
      .forEach(({ brand, assignment, isCurrent }) => {
        const status = isCurrent ? "✅" : "⚠️";
        console.log(`   ${status} ${brand.name}: ${assignment.image_filename}`);
      });

    console.log(
      `\n⚠️  Unverified assignments: ${unverifiedAssignments.length}`
    );
    unverifiedAssignments
      .slice(0, 10)
      .forEach(({ brand, assignment, isCurrent }) => {
        const status = isCurrent ? "✅" : "❌";
        console.log(`   ${status} ${brand.name}: ${assignment.image_filename}`);
      });

    // Define variables outside the if block
    const mismatches = issues.filter((i) => i.type === "MISMATCH");
    const unverified = issues.filter((i) => i.type === "UNVERIFIED");

    if (issues.length > 0) {
      console.log(`\n🚨 Issues found: ${issues.length}`);

      if (mismatches.length > 0) {
        console.log(`\n❌ Mismatches (${mismatches.length}):`);
        mismatches.forEach((issue) => {
          console.log(`   🚨 ${issue.brand}:`);
          console.log(`      Expected: ${issue.expected}`);
          console.log(`      Actual: ${issue.actual || "No image"}`);
        });
      }

      if (unverified.length > 0) {
        console.log(`\n⚠️  Unverified assignments (${unverified.length}):`);
        unverified.slice(0, 10).forEach((issue) => {
          console.log(`   ⚠️  ${issue.brand}: ${issue.filename}`);
        });
      }
    }

    // 6. Recommendations
    console.log("\n💡 Step 6: Recommendations...");

    if (issues.length === 0) {
      console.log("🎉 All assignments are verified and correct!");
    } else {
      console.log("🔧 Actions needed:");

      if (mismatches.length > 0) {
        console.log(`   1. Fix ${mismatches.length} mismatched assignments`);
        console.log("      - Update brand.image to match assignment");
        console.log(
          "      - Or update assignment to match current brand image"
        );
      }

      if (unverified.length > 0) {
        console.log(`   2. Verify ${unverified.length} unverified assignments`);
        console.log("      - Manually check each brand-image pair");
        console.log("      - Mark as verified if correct");
        console.log("      - Fix if incorrect");
      }

      console.log("\n🚀 Next steps:");
      console.log(
        "   1. Run fix-mismatched-assignments.js to correct mismatches"
      );
      console.log("   2. Manually verify unverified assignments");
      console.log("   3. Use this table for future image management");
    }

    // 7. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Brand image association verification completed!");

    console.log(`\n📊 Summary:`);
    console.log(`   📋 Total assignments: ${assignments.length}`);
    console.log(`   ✅ Verified: ${verifiedAssignments.length}`);
    console.log(`   ⚠️  Unverified: ${unverifiedAssignments.length}`);
    console.log(
      `   ❌ Mismatches: ${issues.filter((i) => i.type === "MISMATCH").length}`
    );
  } catch (error) {
    console.error("❌ Error in verifyBrandImageAssociations:", error);
  }
}

// Run the verification
verifyBrandImageAssociations()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
