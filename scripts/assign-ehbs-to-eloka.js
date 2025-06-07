const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function assignEhbsToEloka() {
  try {
    console.log("🎯 Assigning EHBS Couture to eloka@culturin.com");

    // 1. Check for EHBS Couture brand
    console.log("\n1️⃣ Finding EHBS Couture brand...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, category, location")
      .ilike("name", "%ehbs%");

    if (brandsError) {
      console.error("❌ Error finding brands:", brandsError);
      return;
    }

    console.log("✅ Found brands:", brands);

    const ehbsBrand = brands.find(
      (brand) =>
        brand.name.toLowerCase().includes("ehbs") &&
        brand.name.toLowerCase().includes("couture")
    );

    if (!ehbsBrand) {
      console.error("❌ EHBS Couture brand not found");
      return;
    }

    console.log(
      `✅ Found EHBS Couture: ${ehbsBrand.name} (ID: ${ehbsBrand.id})`
    );

    // 2. Check current user profile
    console.log("\n2️⃣ Checking current user profile...");
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .eq("email", "eloka@culturin.com")
      .single();

    if (userError) {
      console.error("❌ User error:", userError);
      return;
    }

    console.log("👤 Current user:", {
      email: user.email,
      role: user.role,
      owned_brands: user.owned_brands,
    });

    // 3. Check if brand is already owned
    const currentOwnedBrands = user.owned_brands || [];
    if (currentOwnedBrands.includes(ehbsBrand.id)) {
      console.log("✅ User already owns EHBS Couture!");
      return;
    }

    // 4. Update user to include EHBS Couture in owned brands
    console.log("\n3️⃣ Adding EHBS Couture to owned brands...");
    const newOwnedBrands = [...currentOwnedBrands, ehbsBrand.id];

    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({
        owned_brands: newOwnedBrands,
        role: "brand_admin", // Ensure user has brand_admin role
      })
      .eq("email", "eloka@culturin.com")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating user:", updateError);
      return;
    }

    console.log("✅ Successfully updated user!");
    console.log("👤 Updated user:", {
      email: updatedUser.email,
      role: updatedUser.role,
      owned_brands: updatedUser.owned_brands,
    });

    console.log(
      "\n🎉 EHBS Couture has been successfully assigned to eloka@culturin.com!"
    );
    console.log("🔑 User now has brand_admin role and can manage EHBS Couture");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

assignEhbsToEloka();
