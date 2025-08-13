import { getBrandCurrency } from "./currencyUtils";

/**
 * Format a number with commas for thousands
 * @param value - The number to format
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * Format a price range string
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param currencySymbol - Currency symbol to use
 * @returns Formatted price range string
 */
export function formatPriceRange(
  minPrice: string | number,
  maxPrice: string | number,
  currencySymbol: string = "₦"
): string {
  const min = typeof minPrice === "string" ? parseFloat(minPrice) : minPrice;
  const max = typeof maxPrice === "string" ? parseFloat(maxPrice) : maxPrice;

  if (isNaN(min) || isNaN(max)) {
    return "Contact for pricing";
  }

  const formattedMin = formatNumberWithCommas(min);
  const formattedMax = formatNumberWithCommas(max);

  return `${currencySymbol}${formattedMin} - ${currencySymbol}${formattedMax}`;
}

/**
 * Format a single price with currency
 * @param price - The price to format
 * @param currencySymbol - Currency symbol to use
 * @returns Formatted price string
 */
export function formatPrice(
  price: string | number,
  currencySymbol: string = "₦"
): string {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return `${currencySymbol}0`;
  }

  const formattedPrice = formatNumberWithCommas(numericPrice);
  return `${currencySymbol}${formattedPrice}`;
}

/**
 * Parse a formatted number string back to a number
 * @param formattedValue - The formatted string (e.g., "1,234.56")
 * @returns The parsed number
 */
export function parseFormattedNumber(formattedValue: string): number {
  return parseFloat(formattedValue.replace(/,/g, ""));
}

/**
 * Extract currency symbol from brand price range string
 * @param priceRange - Price range string (e.g., "₦15,000 - ₦120,000")
 * @returns Currency symbol
 * @deprecated Use getBrandCurrency from currencyUtils instead
 */
export function extractCurrencyFromPriceRange(priceRange: string): string {
  if (!priceRange || priceRange === "Contact for pricing") {
    return "₦"; // Default to Naira for Nigerian market
  }

  // Parse price range to extract currency symbol (e.g., "₦15,000 - ₦120,000")
  const priceRangeMatch = priceRange.match(
    /^([^\d,]+)(\d+(?:,\d+)*)\s*-\s*([^\d,]+)(\d+(?:,\d+)*)$/
  );

  if (priceRangeMatch) {
    const [, symbol1] = priceRangeMatch;
    return symbol1.trim();
  }

  return "₦"; // Default fallback
}

/**
 * Format price with brand-specific currency
 * @param price - The price to format
 * @param brandPriceRange - Brand's price range string to extract currency from
 * @returns Formatted price string with correct currency
 * @deprecated Use formatPriceWithBrand from currencyUtils instead
 */
export function formatPriceWithBrandCurrency(
  price: string | number,
  brandPriceRange: string
): string {
  const currencySymbol = extractCurrencyFromPriceRange(brandPriceRange);
  return formatPrice(price, currencySymbol);
}

/**
 * Format price with brand object (preferred method)
 * @param price - The price to format
 * @param brand - Brand object with location and price_range
 * @returns Formatted price string with correct currency
 */
export function formatPriceWithBrand(
  price: string | number,
  brand: { location?: string; price_range?: string } | null
): string {
  const currency = getBrandCurrency(brand);
  return formatPrice(price, currency.symbol);
}

/**
 * Format price range with brand object (preferred method)
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param brand - Brand object with location and price_range
 * @returns Formatted price range string with correct currency
 */
export function formatPriceRangeWithBrand(
  minPrice: string | number,
  maxPrice: string | number,
  brand: { location?: string; price_range?: string } | null
): string {
  const currency = getBrandCurrency(brand);
  return formatPriceRange(minPrice, maxPrice, currency.symbol);
}

/**
 * Get currency symbol from brand (preferred method)
 * @param brand - Brand object with location and price_range
 * @returns Currency symbol
 */
export function getBrandCurrencySymbol(
  brand: { location?: string; price_range?: string } | null
): string {
  const currency = getBrandCurrency(brand);
  return currency.symbol;
}

/**
 * Format product price with brand currency information
 * @param product - Product with price information
 * @param brand - Brand with price_range information
 * @returns Formatted price object with displayPrice, originalPrice, and currency
 */
export function formatProductPrice(
  product: { price: number; sale_price?: number },
  brand?: { price_range?: string; location?: string } | null
): {
  displayPrice: string;
  originalPrice?: string;
  currency: string;
} {
  const currency = getBrandCurrency(brand || null);
  const displayPrice = formatPrice(
    product.sale_price || product.price,
    currency.symbol
  );
  const originalPrice = product.sale_price
    ? formatPrice(product.price, currency.symbol)
    : undefined;

  return {
    displayPrice,
    originalPrice,
    currency: currency.symbol,
  };
}

/**
 * Validate price format
 * @param price - Price string to validate
 * @returns True if valid price format
 */
export function isValidPrice(price: string): boolean {
  const numericPrice = parseFloat(price.replace(/,/g, ""));
  return !isNaN(numericPrice) && numericPrice >= 0;
}

/**
 * Convert price between currencies (basic conversion)
 * @param price - Price to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @param exchangeRates - Exchange rates object
 * @returns Converted price
 */
export function convertPrice(
  price: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return price;

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;

  // Convert to USD first, then to target currency
  const usdPrice = price / fromRate;
  return usdPrice * toRate;
}

export default {
  formatNumberWithCommas,
  formatPriceRange,
  formatPrice,
  parseFormattedNumber,
  extractCurrencyFromPriceRange,
  formatPriceWithBrandCurrency,
  formatPriceWithBrand,
  formatPriceRangeWithBrand,
  getBrandCurrencySymbol,
  formatProductPrice,
  isValidPrice,
  convertPrice,
};
