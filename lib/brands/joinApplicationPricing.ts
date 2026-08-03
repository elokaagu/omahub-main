import { STUDIO_CURRENCIES_FOR_PRICE_SELECT } from "@/lib/brands/studioBrandFormConstants";
import { formatPriceRange } from "@/lib/utils/priceFormatter";

export const EXPLORE_PRICING_LABEL = "Explore brand for prices";

export function buildJoinApplicationPricing(input: {
  currency: string;
  priceMin?: string | null;
  priceMax?: string | null;
  contactForPricing?: boolean;
}): { priceRange: string; currency: string } {
  const currency = input.currency?.trim() || "USD";

  if (input.contactForPricing) {
    return { priceRange: EXPLORE_PRICING_LABEL, currency };
  }

  const min = input.priceMin?.trim();
  const max = input.priceMax?.trim();
  if (!min || !max) {
    return { priceRange: EXPLORE_PRICING_LABEL, currency };
  }

  const symbol =
    STUDIO_CURRENCIES_FOR_PRICE_SELECT.find((c) => c.code === currency)
      ?.symbol || "$";

  return {
    priceRange: formatPriceRange(min, max, symbol),
    currency,
  };
}
