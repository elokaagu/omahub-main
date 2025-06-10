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
