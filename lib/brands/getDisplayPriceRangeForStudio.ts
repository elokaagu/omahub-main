/**
 * Human-readable price range for studio brand editor helper text.
 * Treats empty ranges and placeholder-style equal low amounts as "explore" copy.
 */
export function getDisplayPriceRangeForStudio(
  priceRange: string | null | undefined
): string {
  if (!priceRange) {
    return "Explore brand for prices";
  }

  const priceMatch = priceRange.match(
    /^(.+?)(\d+(?:,\d+)*)\s*-\s*(.+?)(\d+(?:,\d+)*)$/
  );
  if (priceMatch) {
    const [, , min, , max] = priceMatch;
    const minNum = parseFloat(min.replace(/,/g, ""));
    const maxNum = parseFloat(max.replace(/,/g, ""));

    if (minNum === maxNum && minNum <= 100) {
      return "Explore brand for prices";
    }
  }

  return priceRange;
}
