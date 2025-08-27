import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
    const supabase = createClientComponentClient();
    
    console.log(`🔄 Syncing product currencies for brand ${brandId} to ${newCurrency}`);
    
    // Update all products for this brand to use the new currency
    const { data, error } = await supabase
      .from("products")
      .update({ 
        currency: newCurrency,
        updated_at: new Date().toISOString()
      })
      .eq("brand_id", brandId)
      .select("id");
    
    // Get the count of updated products
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId);
    
    if (error) {
      console.error("❌ Error syncing product currencies:", error);
      return {
        success: false,
        updatedCount: 0,
        error: error.message
      };
    }
    
    console.log(`✅ Successfully synced ${count || 0} products to currency ${newCurrency}`);
    
    return {
      success: true,
      updatedCount: count || 0
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
