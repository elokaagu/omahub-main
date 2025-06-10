// Common currencies used across Africa
export const CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "GHS", name: "Ghanaian Cedi" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "EGP", symbol: "EGP", name: "Egyptian Pound" },
  { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
  { code: "TND", symbol: "TND", name: "Tunisian Dinar" },
  { code: "XOF", symbol: "XOF", name: "West African CFA Franc" },
  { code: "DZD", symbol: "DA", name: "Algerian Dinar" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

// Function to extract currency symbol from brand price range
export const extractCurrencyFromPriceRange = (priceRange: string): string => {
  if (!priceRange || priceRange === "Contact for pricing") {
    return "$"; // Default to USD
  }

  // Parse price range to extract currency symbol (e.g., "₦15,000 - ₦120,000")
  const priceRangeMatch = priceRange.match(
    /^(.+?)(\d+(?:,\d+)*)\s*-\s*(.+?)(\d+(?:,\d+)*)$/
  );

  if (priceRangeMatch) {
    const [, symbol1] = priceRangeMatch;
    const foundCurrency = CURRENCIES.find((c) => c.symbol === symbol1.trim());
    if (foundCurrency) {
      return foundCurrency.symbol;
    }
  }

  return "$"; // Default fallback
};

// Function to get currency symbol from brand
export const getBrandCurrency = (
  brand: { price_range?: string } | null
): string => {
  if (!brand || !brand.price_range) {
    return "$";
  }
  return extractCurrencyFromPriceRange(brand.price_range);
};
