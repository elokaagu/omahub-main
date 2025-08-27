import { getAdminClient } from "@/lib/supabase-admin";

/**
 * Sync product currencies to match their brand's currency
 * @param brandId - The brand ID
 * @param newCurrency - The new currency code (e.g., 'USD', 'GBP')
 * @returns Promise<{ success: boolean; updatedCount: number; error?: string }>
 */
export async function syncProductCurrencies(
  brandId: string,
  newCurrency: string
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client for currency sync");
      return {
        success: false,
        updatedCount: 0,
        error: "Admin client not available"
      };
    }
    
    console.log(`🔄 Syncing product currencies for brand ${brandId} to ${newCurrency}`);
    
    // First, get the count of products for this brand
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId);
    
    if (count === null || count === 0) {
      console.log(`ℹ️ No products found for brand ${brandId}`);
      return {
        success: true,
        updatedCount: 0
      };
    }
    
    // Update all products for this brand to use the new currency
    const { data, error } = await supabase
      .from("products")
      .update({ 
        currency: newCurrency,
        updated_at: new Date().toISOString()
      })
      .eq("brand_id", brandId)
      .select("id");
    
    if (error) {
      console.error("❌ Error syncing product currencies:", error);
      return {
        success: false,
        updatedCount: 0,
        error: error.message
      };
    }
    
    console.log(`✅ Successfully synced ${count} products to currency ${newCurrency}`);
    
    return {
      success: true,
      updatedCount: count
    };
    
  } catch (error) {
    console.error("❌ Unexpected error in syncProductCurrencies:", error);
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Sync product currencies for multiple brands
 * @param brandUpdates - Array of brand updates with ID and new currency
 * @returns Promise<{ success: boolean; results: Array<{ brandId: string; success: boolean; updatedCount: number; error?: string }> }>
 */
export async function syncMultipleBrandCurrencies(
  brandUpdates: Array<{ brandId: string; newCurrency: string }>
): Promise<{ 
  success: boolean; 
  results: Array<{ 
    brandId: string; 
    success: boolean; 
    updatedCount: number; 
    error?: string 
  }> 
}> {
  const results = [];
  let overallSuccess = true;
  
  for (const update of brandUpdates) {
    const result = await syncProductCurrencies(update.brandId, update.newCurrency);
    results.push({
      brandId: update.brandId,
      ...result
    });
    
    if (!result.success) {
      overallSuccess = false;
    }
  }
  
  return {
    success: overallSuccess,
    results
  };
}

/**
 * Manual sync function to fix currency inconsistencies
 * This should be run when there are currency mismatches between brands and products
 */
export async function syncAllBrandCurrencies(): Promise<{
  success: boolean;
  results: Array<{
    brandId: string;
    brandName: string;
    brandCurrency: string;
    productsUpdated: number;
    success: boolean;
    error?: string;
  }>;
}> {
  try {
    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client for currency sync");
      return {
        success: false,
        results: []
      };
    }
    
    console.log("🔄 Starting comprehensive currency sync for all brands...");
    
    // Get all brands with their currencies
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, currency, location")
      .not("currency", "is", null);
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return {
        success: false,
        results: []
      };
    }
    
    if (!brands || brands.length === 0) {
      console.log("ℹ️ No brands found with currency information");
      return {
        success: true,
        results: []
      };
    }
    
    console.log(`📊 Found ${brands.length} brands to sync`);
    
    const results = [];
    let overallSuccess = true;
    
    for (const brand of brands) {
      console.log(`🔄 Syncing brand: ${brand.name} (${brand.currency})`);
      
      try {
        const syncResult = await syncProductCurrencies(brand.id, brand.currency);
        
        results.push({
          brandId: brand.id,
          brandName: brand.name,
          brandCurrency: brand.currency,
          productsUpdated: syncResult.updatedCount,
          success: syncResult.success,
          error: syncResult.error
        });
        
        if (!syncResult.success) {
          overallSuccess = false;
          console.error(`❌ Failed to sync brand ${brand.name}:`, syncResult.error);
        } else {
          console.log(`✅ Successfully synced ${brand.name}: ${syncResult.updatedCount} products updated`);
        }
      } catch (error) {
        console.error(`❌ Error syncing brand ${brand.name}:`, error);
        results.push({
          brandId: brand.id,
          brandName: brand.name,
          brandCurrency: brand.currency,
          productsUpdated: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        overallSuccess = false;
      }
    }
    
    console.log(`🎉 Currency sync completed. Overall success: ${overallSuccess}`);
    console.log(`📊 Results: ${results.filter(r => r.success).length}/${results.length} brands synced successfully`);
    
    return {
      success: overallSuccess,
      results
    };
    
  } catch (error) {
    console.error("❌ Unexpected error in syncAllBrandCurrencies:", error);
    return {
      success: false,
      results: []
    };
  }
}

/**
 * Check for currency inconsistencies between brands and products
 * Returns brands that have products with mismatched currencies
 */
export async function checkCurrencyInconsistencies(): Promise<{
  success: boolean;
  inconsistencies: Array<{
    brandId: string;
    brandName: string;
    brandCurrency: string;
    mismatchedProducts: Array<{
      productId: string;
      productName: string;
      productCurrency: string;
    }>;
  }>;
}> {
  try {
    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client for currency check");
      return {
        success: false,
        inconsistencies: []
      };
    }
    
    console.log("🔍 Checking for currency inconsistencies...");
    
    // Get all brands with their currencies
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, currency")
      .not("currency", "is", null);
    
    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return {
        success: false,
        inconsistencies: []
      };
    }
    
    const inconsistencies = [];
    
    for (const brand of brands) {
      // Get products for this brand that have different currencies
      const { data: mismatchedProducts, error: productsError } = await supabase
        .from("products")
        .select("id, title, currency")
        .eq("brand_id", brand.id)
        .neq("currency", brand.currency)
        .not("currency", "is", null);
      
      if (productsError) {
        console.error(`❌ Error checking products for brand ${brand.name}:`, productsError);
        continue;
      }
      
      if (mismatchedProducts && mismatchedProducts.length > 0) {
        inconsistencies.push({
          brandId: brand.id,
          brandName: brand.name,
          brandCurrency: brand.currency,
          mismatchedProducts: mismatchedProducts.map(p => ({
            productId: p.id,
            productName: p.title,
            productCurrency: p.currency
          }))
        });
        
        console.log(`⚠️ Found ${mismatchedProducts.length} products with mismatched currency for brand ${brand.name}`);
      }
    }
    
    console.log(`🔍 Currency check completed. Found ${inconsistencies.length} brands with inconsistencies`);
    
    return {
      success: true,
      inconsistencies
    };
    
  } catch (error) {
    console.error("❌ Unexpected error in checkCurrencyInconsistencies:", error);
    return {
      success: false,
      inconsistencies: []
    };
  }
}

/**
 * Get currency from price range string
 * @param priceRange - Price range string (e.g., "$15000 - $120000")
 * @returns Currency code or null if not found
 */
export function extractCurrencyFromPriceRange(priceRange: string): string | null {
  if (!priceRange || priceRange === "Contact for pricing") {
    return null;
  }
  
  // Common currency symbols and their codes
  const currencyMap: Record<string, string> = {
    "$": "USD",
    "£": "GBP",
    "€": "EUR",
    "₦": "NGN",
    "KSh": "KES",
    "GHS": "GHS",
    "R": "ZAR",
    "EGP": "EGP",
    "MAD": "MAD",
    "TND": "TND",
    "XOF": "XOF",
    "DA": "DZD"
  };
  
  // Check for currency symbols at the start of the price range
  for (const [symbol, code] of Object.entries(currencyMap)) {
    if (priceRange.startsWith(symbol)) {
      return code;
    }
  }
  
  return null;
}
