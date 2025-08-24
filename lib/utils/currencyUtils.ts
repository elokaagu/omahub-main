// Centralized currency utilities for OmaHub
// This fixes currency inconsistency issues across brands and products

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  country: string;
  defaultLocation?: string[];
}

// Centralized currency definitions
export const CURRENCIES: Currency[] = [
  {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira",
    country: "Nigeria",
    defaultLocation: ["Nigeria", "Lagos", "Abuja", "Port Harcourt"],
  },
  {
    code: "GHS",
    symbol: "GHS",
    name: "Ghanaian Cedi",
    country: "Ghana",
    defaultLocation: ["Ghana", "Accra", "Kumasi", "Tamale"],
  },
  {
    code: "KES",
    symbol: "KSh",
    name: "Kenyan Shilling",
    country: "Kenya",
    defaultLocation: ["Kenya", "Nairobi", "Mombasa", "Kisumu"],
  },
  {
    code: "ZAR",
    symbol: "R",
    name: "South African Rand",
    country: "South Africa",
    defaultLocation: ["South Africa", "Johannesburg", "Cape Town", "Durban"],
  },
  {
    code: "EGP",
    symbol: "EGP",
    name: "Egyptian Pound",
    country: "Egypt",
    defaultLocation: ["Egypt", "Cairo", "Alexandria", "Giza"],
  },
  {
    code: "MAD",
    symbol: "MAD",
    name: "Moroccan Dirham",
    country: "Morocco",
    defaultLocation: ["Morocco", "Casablanca", "Rabat", "Marrakech"],
  },
  {
    code: "TND",
    symbol: "TND",
    name: "Tunisian Dinar",
    country: "Tunisia",
    defaultLocation: ["Tunisia", "Tunis", "Sfax", "Sousse"],
  },
  {
    code: "XOF",
    symbol: "XOF",
    name: "West African CFA Franc",
    country: "West Africa",
    defaultLocation: ["Senegal", "Ivory Coast", "Burkina Faso", "Mali"],
  },
  {
    code: "DZD",
    symbol: "DA",
    name: "Algerian Dinar",
    country: "Algeria",
    defaultLocation: ["Algeria", "Algiers", "Oran", "Constantine"],
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    country: "United States",
    defaultLocation: ["United States", "USA"],
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    country: "European Union",
    defaultLocation: ["European Union", "EU"],
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    country: "United Kingdom",
    defaultLocation: ["United Kingdom", "UK", "England", "Scotland", "Wales"],
  },
];

/**
 * Get currency by code
 */
export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find((c) => c.code === code.toUpperCase());
}

/**
 * Get currency by symbol
 */
export function getCurrencyBySymbol(symbol: string): Currency | undefined {
  return CURRENCIES.find((c) => c.symbol === symbol);
}

/**
 * Get currency by country/location
 */
export function getCurrencyByLocation(location: string): Currency | undefined {
  if (!location) return undefined;

  const normalizedLocation = location.toLowerCase();

  // First try exact country match
  const countryMatch = CURRENCIES.find(
    (c) => c.country.toLowerCase() === normalizedLocation
  );
  if (countryMatch) return countryMatch;

  // Then try default location matches
  const locationMatch = CURRENCIES.find((c) =>
    c.defaultLocation?.some(
      (loc) =>
        loc.toLowerCase().includes(normalizedLocation) ||
        normalizedLocation.includes(loc.toLowerCase())
    )
  );
  if (locationMatch) return locationMatch;

  // Fallback: try partial matches
  return CURRENCIES.find((c) =>
    c.defaultLocation?.some(
      (loc) =>
        loc.toLowerCase().includes(normalizedLocation) ||
        normalizedLocation.includes(loc.toLowerCase())
    )
  );
}

/**
 * Extract currency from brand price range
 * @param priceRange - Price range string (e.g., "₦15,000 - ₦120,000")
 * @returns Currency object or undefined
 */
export function extractCurrencyFromPriceRange(
  priceRange: string
): Currency | undefined {
  if (!priceRange || priceRange === "Contact for pricing") {
    return undefined;
  }

  // Parse price range to extract currency symbol (e.g., "₦15,000 - ₦120,000")
  const priceRangeMatch = priceRange.match(
    /^([^\d,]+)(\d+(?:,\d+)*)\s*-\s*([^\d,]+)(\d+(?:,\d+)*)$/
  );

  if (priceRangeMatch) {
    const [, symbol1] = priceRangeMatch;
    const foundCurrency = CURRENCIES.find((c) => c.symbol === symbol1.trim());
    if (foundCurrency) {
      return foundCurrency;
    }
  }

  return undefined;
}

/**
 * Get brand currency from brand data
 * @param brand - Brand object with location and price_range
 * @returns Currency object or undefined if no currency can be determined
 */
export function getBrandCurrency(
  brand: { location?: string; price_range?: string } | null
): Currency | undefined {
  // Debug logging for currency issues
  if (process.env.NODE_ENV === "development") {
    console.log("getBrandCurrency debug:", {
      brand,
      priceRange: brand?.price_range,
      location: brand?.location,
    });
  }

  if (!brand) {
    console.log("getBrandCurrency: No brand data provided");
    return undefined;
  }

  // First try to extract from price_range (highest priority)
  if (brand.price_range && brand.price_range !== "Contact for pricing") {
    const currencyFromPrice = extractCurrencyFromPriceRange(brand.price_range);
    if (currencyFromPrice) {
      console.log(
        "getBrandCurrency: Found currency from price_range:",
        currencyFromPrice
      );
      return currencyFromPrice;
    } else {
      console.log(
        "getBrandCurrency: Could not extract currency from price_range:",
        brand.price_range
      );
    }
  }

  // Then try to determine from location
  if (brand.location) {
    const currencyFromLocation = getCurrencyByLocation(brand.location);
    if (currencyFromLocation) {
      console.log(
        "getBrandCurrency: Found currency from location:",
        currencyFromLocation
      );
      return currencyFromLocation;
    } else {
      console.log(
        "getBrandCurrency: Could not find currency for location:",
        brand.location
      );
    }
  }

  // No currency could be determined - return undefined instead of forcing a default
  console.log("getBrandCurrency: No currency could be determined");
  return undefined;
}

/**
 * Format price with brand-specific currency
 * @param price - The price to format
 * @param brand - Brand object to determine currency
 * @returns Formatted price string with correct currency
 */
export function formatPriceWithBrandCurrency(
  price: string | number,
  brand: { location?: string; price_range?: string } | null
): string {
  const currency = getBrandCurrency(brand);
  const numericPrice =
    typeof price === "string" ? parseFloat(price.replace(/,/g, "")) : price;

  if (isNaN(numericPrice)) {
    return `${currency?.symbol || "₦"}0`;
  }

  // Format with commas for thousands
  const formattedPrice = numericPrice.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${currency?.symbol || "₦"}${formattedPrice}`;
}

/**
 * Format price range with brand-specific currency
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param brand - Brand object to determine currency
 * @returns Formatted price range string
 */
export function formatPriceRangeWithBrandCurrency(
  minPrice: string | number,
  maxPrice: string | number,
  brand: { location?: string; price_range?: string } | null
): string {
  const currency = getBrandCurrency(brand);

  const min =
    typeof minPrice === "string"
      ? parseFloat(minPrice.replace(/,/g, ""))
      : minPrice;
  const max =
    typeof maxPrice === "string"
      ? parseFloat(maxPrice.replace(/,/g, ""))
      : maxPrice;

  if (isNaN(min) || isNaN(max)) {
    return "Contact for pricing";
  }

  const formattedMin = min.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const formattedMax = max.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${currency?.symbol || "₦"}${formattedMin} - ${currency?.symbol || "₦"}${formattedMax}`;
}

/**
 * Get default currency for a location
 * @param location - Location string
 * @returns Default currency for that location
 */
export function getDefaultCurrencyForLocation(location: string): Currency {
  const currency = getCurrencyByLocation(location);
  return currency || getCurrencyByCode("NGN")!;
}

/**
 * Validate currency consistency for a brand
 * @param brand - Brand object
 * @returns Object with validation results
 */
export function validateBrandCurrency(brand: {
  location?: string;
  price_range?: string;
}): {
  isValid: boolean;
  locationCurrency?: Currency;
  priceRangeCurrency?: Currency;
  mismatch: boolean;
  recommendation: string;
} {
  const locationCurrency = brand.location
    ? getCurrencyByLocation(brand.location)
    : undefined;
  const priceRangeCurrency = brand.price_range
    ? extractCurrencyFromPriceRange(brand.price_range)
    : undefined;

  const mismatch =
    locationCurrency &&
    priceRangeCurrency &&
    locationCurrency.code !== priceRangeCurrency.code;

  let recommendation = "";
  if (mismatch) {
    recommendation = `Currency mismatch: Location suggests ${locationCurrency?.name} (${locationCurrency?.symbol}) but price range uses ${priceRangeCurrency?.name} (${priceRangeCurrency?.symbol}). Consider updating the price range to match the location.`;
  } else if (!priceRangeCurrency && locationCurrency) {
    recommendation = `No price range currency found. Consider adding a price range with ${locationCurrency.symbol} to match the location.`;
  } else if (!locationCurrency && priceRangeCurrency) {
    recommendation = `Location not recognized. Consider updating the location to match the currency (${priceRangeCurrency.country}).`;
  }

  return {
    isValid: !mismatch,
    locationCurrency,
    priceRangeCurrency,
    mismatch: !!mismatch,
    recommendation,
  };
}

export default {
  CURRENCIES,
  getCurrencyByCode,
  getCurrencyBySymbol,
  getCurrencyByLocation,
  extractCurrencyFromPriceRange,
  getBrandCurrency,
  formatPriceWithBrandCurrency,
  formatPriceRangeWithBrandCurrency,
  getDefaultCurrencyForLocation,
  validateBrandCurrency,
};
