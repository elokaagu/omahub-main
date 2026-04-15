import { getAllCategoryNames } from "@/lib/data/unified-categories";

export const SHORT_DESCRIPTION_LIMIT = 150;
export const BRAND_NAME_LIMIT = 50;

/** Full list including NONE (explore pricing) for edit flows. */
export const STUDIO_CURRENCIES = [
  { code: "NONE", symbol: "—", name: "No Currency (Explore brand for prices)" },
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
] as const;

/** Currency dropdown when entering numeric min/max (create + edit price fields). */
export const STUDIO_CURRENCIES_FOR_PRICE_SELECT = STUDIO_CURRENCIES.filter(
  (c) => c.code !== "NONE"
);

export function getStudioBrandCategoryNames(): string[] {
  return getAllCategoryNames();
}

export function getFoundingYearOptions(): string[] {
  const y = new Date().getFullYear();
  return Array.from({ length: y - 1950 + 1 }, (_, i) => String(y - i));
}
