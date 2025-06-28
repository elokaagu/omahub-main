/**
 * Configuration for leads management features
 */

export const LEADS_CONFIG = {
  // Pipeline Value Settings
  SHOW_PIPELINE_VALUE: true, // Set to false to completely hide pipeline value
  USE_INTELLIGENT_CALCULATION: true, // Set to true to use brand product averages instead of estimated_value

  // Pipeline Value Calculation Multipliers (used when USE_INTELLIGENT_CALCULATION is true)
  STATUS_MULTIPLIERS: {
    new: 0.3, // 30% of average price for new leads
    contacted: 0.5, // 50% for contacted leads
    qualified: 0.8, // 80% for qualified leads
    converted: 1.2, // 120% for converted leads (they might buy multiple items)
    lost: 0.0, // 0% for lost leads
    closed: 1.0, // 100% for closed leads
  },

  // Fallback values when brand pricing data is not available
  FALLBACK_VALUES: {
    new: 200,
    contacted: 300,
    qualified: 400,
    converted: 500,
    lost: 0,
    closed: 450,
  },

  // Default pipeline value calculation method
  DEFAULT_CALCULATION_METHOD: "intelligent" as "simple" | "intelligent",
} as const;

export type LeadStatus = keyof typeof LEADS_CONFIG.STATUS_MULTIPLIERS;
