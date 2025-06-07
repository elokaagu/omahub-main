const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBrandAdminAccess() {
  try {
    console.log("🧪 Testing Brand Admin Access for eloka@culturin.com");

    // 1. Get user profile
    console.log("\n1️⃣ Getting user profile...");
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "eloka@culturin.com")
      .single();

    if (userError) {
      console.error("❌ User error:", userError);
      return;
    }

    console.log("👤 User profile:", {
      email: user.email,
      role: user.role,
      owned_brands: user.owned_brands,
    });

    const isBrandOwner = user.role === "brand_admin";
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    const ownedBrandIds = user.owned_brands || [];

    console.log("🔍 Access levels:", {
      isBrandOwner,
      isAdmin,
      ownedBrandIds,
    });

    // 2. Test Brands filtering
    console.log("\n2️⃣ Testing Brands page filtering...");
    const { data: allBrands, error: brandsError } = await supabase
      .from("brands")
      .select("*");

    if (brandsError) {
      console.error("❌ Brands error:", brandsError);
      return;
    }

    let visibleBrands;
    if (isAdmin) {
      visibleBrands = allBrands;
      console.log("👑 Admin view: All brands visible");
    } else if (isBrandOwner && ownedBrandIds.length > 0) {
      visibleBrands = allBrands.filter((brand) =>
        ownedBrandIds.includes(brand.id)
      );
      console.log("🏢 Brand owner view: Filtered brands");
    } else {
      visibleBrands = [];
      console.log("🚫 No access: No brands visible");
    }

    console.log(
      `📊 Brands visible: ${visibleBrands.length}/${allBrands.length}`
    );
    visibleBrands.forEach((brand, index) => {
      console.log(`  ${index + 1}. ${brand.name} (${brand.id})`);
    });

    // 3. Test Catalogues filtering
    console.log("\n3️⃣ Testing Catalogues page filtering...");
    const { data: allCatalogues, error: cataloguesError } = await supabase
      .from("catalogues")
      .select("*, brands(name)")
      .order("created_at", { ascending: false });

    if (cataloguesError) {
      console.error("❌ Catalogues error:", cataloguesError);
      return;
    }

    let visibleCatalogues;
    if (isAdmin) {
      visibleCatalogues = allCatalogues;
      console.log("👑 Admin view: All catalogues visible");
    } else if (isBrandOwner && ownedBrandIds.length > 0) {
      visibleCatalogues = allCatalogues.filter((catalogue) =>
        ownedBrandIds.includes(catalogue.brand_id)
      );
      console.log("🏢 Brand owner view: Filtered catalogues");
    } else {
      visibleCatalogues = [];
      console.log("🚫 No access: No catalogues visible");
    }

    console.log(
      `📚 Catalogues visible: ${visibleCatalogues.length}/${allCatalogues.length}`
    );
    visibleCatalogues.forEach((catalogue, index) => {
      const brandName = catalogue.brands?.name || "Unknown Brand";
      console.log(`  ${index + 1}. ${catalogue.title} (${brandName})`);
    });

    // 4. Test Products filtering
    console.log("\n4️⃣ Testing Products page filtering...");
    const { data: allProducts, error: productsError } = await supabase
      .from("products")
      .select("*, brands(name)")
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("❌ Products error:", productsError);
      return;
    }

    let visibleProducts;
    if (isAdmin) {
      visibleProducts = allProducts;
      console.log("👑 Admin view: All products visible");
    } else if (isBrandOwner && ownedBrandIds.length > 0) {
      visibleProducts = allProducts.filter((product) =>
        ownedBrandIds.includes(product.brand_id)
      );
      console.log("🏢 Brand owner view: Filtered products");
    } else {
      visibleProducts = [];
      console.log("🚫 No access: No products visible");
    }

    console.log(
      `🛍️ Products visible: ${visibleProducts.length}/${allProducts.length}`
    );
    visibleProducts.forEach((product, index) => {
      const brandName = product.brands?.name || "Unknown Brand";
      console.log(`  ${index + 1}. ${product.title} (${brandName})`);
    });

    // 5. Summary
    console.log("\n🎯 SUMMARY FOR eloka@culturin.com:");
    console.log("=====================================");
    console.log(`👤 Role: ${user.role}`);
    console.log(`🏢 Owned Brands: ${ownedBrandIds.join(", ")}`);
    console.log(`📊 Brands in "Your Brands": ${visibleBrands.length}`);
    console.log(
      `📚 Catalogues in "Your Catalogues": ${visibleCatalogues.length}`
    );
    console.log(`🛍️ Products in "Your Products": ${visibleProducts.length}`);

    if (visibleBrands.length > 0) {
      console.log("\n✅ SUCCESS: User should see their content in the studio!");
    } else {
      console.log("\n❌ ISSUE: User won't see any content in the studio!");
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

testBrandAdminAccess();
