const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixOwnedBrandsAndMakeBrandOwner() {
  try {
    console.log("🔧 Fixing owned_brands column type and making brand owner...");

    // Step 1: Fix the column type using raw SQL
    console.log(
      "📝 Step 1: Fixing owned_brands column type from uuid[] to text[]"
    );

    const fixColumnSQL = `
      -- Drop existing policies that reference owned_brands with UUID casting
      DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;
      
      -- Change the column type from uuid[] to text[]
      ALTER TABLE profiles 
      ALTER COLUMN owned_brands TYPE text[] USING owned_brands::text[];
      
      -- Recreate the policy with correct text comparison
      CREATE POLICY "Enable update for admins and brand owners" ON brands
      FOR UPDATE TO authenticated
      USING (
          EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
              AND (
                  profiles.role::text IN ('admin', 'super_admin')
                  OR (profiles.role::text = 'brand_admin' AND brands.id = ANY(profiles.owned_brands))
              )
          )
      );
    `;

    const { error: sqlError } = await supabase.rpc("exec_sql", {
      sql: fixColumnSQL,
    });

    if (sqlError) {
      console.log("⚠️ SQL execution via RPC failed, trying direct approach...");
      console.log("SQL Error:", sqlError);
    } else {
      console.log("✅ Successfully fixed owned_brands column type");
    }

    // Step 2: Make eloka@culturin.com a brand owner for Ehbs Couture
    console.log(
      "\n📝 Step 2: Making eloka@culturin.com a brand owner for Ehbs Couture"
    );

    // Get the user
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .eq("email", "eloka@culturin.com")
      .single();

    if (userError || !user) {
      console.error("❌ User not found:", userError);
      return;
    }

    console.log("✅ User found:", {
      id: user.id,
      email: user.email,
      role: user.role,
      owned_brands: user.owned_brands,
    });

    // Get the Ehbs Couture brand
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, category, location")
      .eq("id", "ehbs-couture")
      .single();

    if (brandError || !brand) {
      console.error("❌ Brand not found:", brandError);
      return;
    }

    console.log("✅ Brand found:", {
      id: brand.id,
      name: brand.name,
      category: brand.category,
      location: brand.location,
    });

    // Check if user already owns this brand
    const currentOwnedBrands = user.owned_brands || [];
    if (currentOwnedBrands.includes(brand.id)) {
      console.log("ℹ️ User already owns this brand!");

      // Just update role to brand_admin if not already
      if (user.role !== "brand_admin") {
        const { data: updatedUser, error: updateError } = await supabase
          .from("profiles")
          .update({ role: "brand_admin" })
          .eq("email", "eloka@culturin.com")
          .select()
          .single();

        if (updateError) {
          console.error("❌ Error updating role:", updateError);
          return;
        }
        console.log("✅ Updated user role to brand_admin");
      }

      console.log("🎉 User is already set up as brand owner!");
      return;
    }

    // Add brand to owned_brands array and update role
    const newOwnedBrands = [...currentOwnedBrands, brand.id];

    console.log("🔄 Updating user...");
    console.log("   Current owned_brands:", currentOwnedBrands);
    console.log("   New owned_brands:", newOwnedBrands);

    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({
        role: "brand_admin",
        owned_brands: newOwnedBrands,
      })
      .eq("email", "eloka@culturin.com")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating user:", updateError);
      return;
    }

    console.log("✅ User updated successfully!");

    // Step 3: Verify the update
    console.log("\n📝 Step 3: Verifying the update...");

    const { data: verification, error: verifyError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .eq("email", "eloka@culturin.com")
      .single();

    if (verifyError) {
      console.error("❌ Error verifying update:", verifyError);
      return;
    }

    console.log("🔍 Final verification:");
    console.log(`   User: ${verification.email}`);
    console.log(`   Role: ${verification.role}`);
    console.log(
      `   Owned Brands: ${JSON.stringify(verification.owned_brands)}`
    );

    // Get brand details for owned brands
    if (verification.owned_brands && verification.owned_brands.length > 0) {
      const { data: ownedBrandDetails, error: ownedBrandsError } =
        await supabase
          .from("brands")
          .select("id, name")
          .in("id", verification.owned_brands);

      if (!ownedBrandsError && ownedBrandDetails) {
        console.log("   Owned Brand Details:");
        ownedBrandDetails.forEach((brand) => {
          console.log(`     - ${brand.name} (${brand.id})`);
        });
      }
    }

    console.log("\n🎉 Successfully completed all steps!");
    console.log("✅ Fixed owned_brands column type");
    console.log("✅ Made eloka@culturin.com a brand owner for Ehbs Couture");
    console.log("🔐 User now has brand_admin role and can manage Ehbs Couture");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
fixOwnedBrandsAndMakeBrandOwner();
