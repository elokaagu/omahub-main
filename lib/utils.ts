import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export price formatting functions from dedicated module
export {
  formatPrice,
  formatPriceRange,
  formatNumberWithCommas,
  parseFormattedNumber,
} from "./utils/priceFormatter";

// Re-export currency utilities
export {
  CURRENCIES,
  extractCurrencyFromPriceRange,
  getBrandCurrency,
} from "./utils/currencyUtils";

// Re-export phone utilities
export {
  isValidWhatsAppNumber,
  formatPhoneForDisplay,
} from "./utils/phoneUtils";

// Re-export remember me utilities
export {
  saveRememberMe,
  getRememberedData,
  clearRememberMe,
  hasRememberMe,
} from "./utils/rememberMe";

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}
