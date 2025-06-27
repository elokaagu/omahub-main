/**
 * Format a number with comma separators for thousands
 * @param value - The number to format
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(value: number | string): string {
  if (typeof value === "string") {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString();
  }
  return value.toLocaleString();
}

/**
 * Format a price with currency symbol and comma separators
 * @param price - The price to format
 * @param currency - Currency symbol (default: $)
 * @returns Formatted price string
 */
export function formatPrice(
  price: number | string,
  currency: string = "$"
): string {
  const formattedNumber = formatNumberWithCommas(price);
  return `${currency}${formattedNumber}`;
}

/**
 * Format a price range with currency symbol and comma separators
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param currency - Currency symbol (default: $)
 * @returns Formatted price range string
 */
export function formatPriceRange(
  minPrice: number | string,
  maxPrice: number | string,
  currency: string = "$"
): string {
  const formattedMin = formatNumberWithCommas(minPrice);
  const formattedMax = formatNumberWithCommas(maxPrice);
  return `${currency}${formattedMin} - ${currency}${formattedMax}`;
}

/**
 * Parse a formatted number string back to a number
 * @param formattedValue - String with commas to parse
 * @returns Parsed number
 */
export function parseFormattedNumber(formattedValue: string): number {
  return parseFloat(formattedValue.replace(/,/g, ""));
}

/**
 * Extract currency symbol from brand price range string
 * @param priceRange - Price range string (e.g., "₦15,000 - ₦120,000")
 * @returns Currency symbol
 */
export function extractCurrencyFromPriceRange(priceRange: string): string {
  if (!priceRange || priceRange === "Contact for pricing") {
    return "$"; // Default to USD
  }

  console.log("🔍 Extracting currency from price range:", priceRange);

  // First try to match currency symbols at the beginning of the price range
  // Pattern: currency symbol followed by digits and commas
  const currencyMatch = priceRange.match(/^([^\d\s]+)/);

  if (currencyMatch) {
    const currency = currencyMatch[1].trim();
    console.log("✅ Extracted currency:", currency);
    return currency;
  }

  // Fallback: try to extract from more complex patterns
  const priceRangeMatch = priceRange.match(
    /^([^\d]+)[\d,]+\s*-\s*([^\d]+)?[\d,]+/
  );

  if (priceRangeMatch) {
    const currency = priceRangeMatch[1].trim();
    console.log("✅ Extracted currency (fallback):", currency);
    return currency;
  }

  console.log("❌ Could not extract currency, using default $");
  return "$"; // Default fallback
}

/**
 * Format price with brand-specific currency
 * @param price - The price to format
 * @param brandPriceRange - Brand's price range string to extract currency from
 * @returns Formatted price string with correct currency
 */
export function formatPriceWithBrandCurrency(
  price: number | string,
  brandPriceRange?: string
): string {
  const currency = extractCurrencyFromPriceRange(brandPriceRange || "");
  return formatPrice(price, currency);
}

/**
 * Format product price with brand currency information
 * @param product - Product with price information
 * @param brand - Brand with price_range information
 * @returns Formatted price string
 */
export function formatProductPrice(
  product: { price: number; sale_price?: number },
  brand?: { price_range?: string }
): {
  displayPrice: string;
  originalPrice?: string;
  currency: string;
} {
  const currency = extractCurrencyFromPriceRange(brand?.price_range || "");
  const displayPrice = formatPrice(
    product.sale_price || product.price,
    currency
  );
  const originalPrice = product.sale_price
    ? formatPrice(product.price, currency)
    : undefined;

  return {
    displayPrice,
    originalPrice,
    currency,
  };
}
