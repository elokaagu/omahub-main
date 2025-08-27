import { getBrandCurrency, getCurrencyByCode, getCurrencyByLocation } from "./currencyUtils";

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
  currencySymbol: string = "$"
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
  currencySymbol: string = "$"
): string {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numericPrice) || numericPrice <= 0) {
    return "Contact designer for pricing";
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
    return "USD"; // Default to USD instead of Naira
  }

  // Parse price range to extract currency symbol (e.g., "₦15,000 - ₦120,000")
  const priceRangeMatch = priceRange.match(
    /^([^\d,]+)(\d+(?:,\d+)*)\s*-\s*([^\d,]+)(\d+(?:,\d+)*)$/
  );

  if (priceRangeMatch) {
    const [, symbol1] = priceRangeMatch;
    return symbol1.trim();
  }

  return "USD"; // Default fallback
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
  
  if (!currency) {
    // Try to use brand location to determine currency
    if (brand?.location) {
      const locationCurrency = getCurrencyByLocation(brand.location);
      if (locationCurrency) {
        return formatPrice(price, locationCurrency.symbol);
      }
    }
    
    // Last resort: use USD as default currency
    return formatPrice(price, "$");
  }
  
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
  
  if (!currency) {
    // Try to use brand location to determine currency
    if (brand?.location) {
      const locationCurrency = getCurrencyByLocation(brand.location);
      if (locationCurrency) {
        return formatPriceRange(minPrice, maxPrice, locationCurrency.symbol);
      }
    }
    
    // Last resort: use USD as default currency
    return formatPriceRange(minPrice, maxPrice, "$");
  }
  
  return formatPriceRange(minPrice, maxPrice, currency.symbol);
}

/**
 * Get currency symbol from brand (preferred method)
 * @param brand - Brand object with location and price_range
 * @returns Currency symbol
 */
export function getBrandCurrencySymbol(
  brand: { location?: string; price_range?: string; currency?: string } | null
): string {
  const currency = getBrandCurrency(brand);
  
  if (!currency) {
    return "";
  }
  
  return currency.symbol;
}

/**
 * Format product price with brand currency information
 * @param product - Product with price information
 * @param brand - Brand with price_range information
 * @returns Formatted price object with displayPrice, originalPrice, and currency
 */
export function formatProductPrice(
  product: { price: number; sale_price?: number; currency?: string },
  brand?: { price_range?: string; location?: string; currency?: string } | null
): {
  displayPrice: string;
  originalPrice?: string;
  currency: string;
} {
  // First priority: use product's currency if available
  if (product.currency) {
    const productCurrency = getCurrencyByCode(product.currency);
    if (productCurrency) {
      // Only use sale_price if it's greater than 0
      const hasValidSalePrice = product.sale_price && product.sale_price > 0;
      const displayPrice = formatPrice(
        hasValidSalePrice ? product.sale_price : product.price,
        productCurrency.symbol
      );
      const originalPrice = hasValidSalePrice
        ? formatPrice(product.price, productCurrency.symbol)
        : undefined;

      return {
        displayPrice,
        originalPrice,
        currency: productCurrency.symbol,
      };
    }
  }

  // Check if brand has a currency
  if (brand?.currency) {
    const brandCurrency = getCurrencyByCode(brand.currency);
    if (brandCurrency) {
      // Only use sale_price if it's greater than 0
      const hasValidSalePrice = product.sale_price && product.sale_price > 0;
      const displayPrice = formatPrice(
        hasValidSalePrice ? product.sale_price : product.price,
        brandCurrency.symbol
      );
      const originalPrice = hasValidSalePrice
        ? formatPrice(product.price, brandCurrency.symbol)
        : undefined;

      return {
        displayPrice,
        originalPrice,
        currency: brandCurrency.symbol,
      };
    }
  }

  // No currency specified - try to use brand location to determine currency
  if (brand?.location) {
    const locationCurrency = getCurrencyByLocation(brand.location);
    if (locationCurrency) {
      // Only use sale_price if it's greater than 0
      const hasValidSalePrice = product.sale_price && product.sale_price > 0;
      const displayPrice = formatPrice(
        hasValidSalePrice ? product.sale_price : product.price,
        locationCurrency.symbol
      );
      const originalPrice = hasValidSalePrice
        ? formatPrice(product.price, locationCurrency.symbol)
        : undefined;

      return {
        displayPrice,
        originalPrice,
        currency: locationCurrency.symbol,
      };
    }
  }

  // Last resort: use USD as default currency
  const defaultCurrency = getCurrencyByCode("USD");
  if (defaultCurrency) {
    // Only use sale_price if it's greater than 0
    const hasValidSalePrice = product.sale_price && product.sale_price > 0;
    const displayPrice = formatPrice(
      hasValidSalePrice ? product.sale_price : product.price,
      defaultCurrency.symbol
    );
    const originalPrice = hasValidSalePrice
      ? formatPrice(product.price, defaultCurrency.symbol)
      : undefined;

    return {
      displayPrice,
      originalPrice,
      currency: defaultCurrency.symbol,
    };
  }

  // If all else fails, show "Contact designer for pricing"
  return {
    displayPrice: "Contact designer for pricing",
    originalPrice: undefined,
    currency: "",
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
