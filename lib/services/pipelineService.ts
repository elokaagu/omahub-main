import { LEADS_CONFIG, type LeadStatus } from "@/lib/config/leads";

interface Lead {
  id: string;
  brand_id: string;
  status: string;
  estimated_value?: number;
}

interface BrandPricingData {
  pricing_stats: {
    price_range: {
      average: number;
    };
  };
}

/**
 * Service for calculating pipeline values from leads data
 */
export class PipelineService {
  /**
   * Calculate pipeline value for an array of leads
   */
  static async calculatePipelineValue(leads: Lead[]): Promise<number> {
    const { USE_INTELLIGENT_CALCULATION, STATUS_MULTIPLIERS, FALLBACK_VALUES } =
      LEADS_CONFIG;

    if (!USE_INTELLIGENT_CALCULATION) {
      return leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
    }

    let totalValue = 0;

    // Create a cache for brand pricing data to avoid duplicate API calls
    const brandPricingCache = new Map<string, number>();

    for (const lead of leads) {
      if (lead.estimated_value && lead.estimated_value > 0) {
        // Use existing estimated value if available
        totalValue += lead.estimated_value;
      } else if (lead.brand_id) {
        let avgPrice = 0;

        // Check cache first
        if (brandPricingCache.has(lead.brand_id)) {
          avgPrice = brandPricingCache.get(lead.brand_id)!;
        } else {
          // Fetch brand pricing data
          try {
            const response = await fetch(
              `/api/brands/${lead.brand_id}/products`
            );
            if (response.ok) {
              const data: BrandPricingData = await response.json();
              avgPrice = data.pricing_stats?.price_range?.average || 0;
              brandPricingCache.set(lead.brand_id, avgPrice);
            }
          } catch (error) {
            console.error(
              `Error fetching pricing for brand ${lead.brand_id}:`,
              error
            );
            avgPrice = 0;
          }
        }

        if (avgPrice > 0) {
          // Use multiplier based on lead status from config
          const multiplier =
            STATUS_MULTIPLIERS[lead.status as LeadStatus] ||
            STATUS_MULTIPLIERS.new;
          totalValue += avgPrice * multiplier;
        } else {
          // Fallback to configured default value based on status
          const defaultValue =
            FALLBACK_VALUES[lead.status as LeadStatus] || FALLBACK_VALUES.new;
          totalValue += defaultValue;
        }
      } else {
        // Fallback for leads without brand association
        const defaultValue =
          FALLBACK_VALUES[lead.status as LeadStatus] || FALLBACK_VALUES.new;
        totalValue += defaultValue;
      }
    }

    return Math.round(totalValue);
  }

  /**
   * Calculate simple pipeline value (sum of estimated_value fields)
   */
  static calculateSimplePipelineValue(leads: Lead[]): number {
    return leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
  }

  /**
   * Get pipeline value breakdown by status
   */
  static async getPipelineBreakdown(
    leads: Lead[]
  ): Promise<Record<string, number>> {
    const breakdown: Record<string, number> = {};

    // Group leads by status
    const leadsByStatus = leads.reduce(
      (acc, lead) => {
        if (!acc[lead.status]) acc[lead.status] = [];
        acc[lead.status].push(lead);
        return acc;
      },
      {} as Record<string, Lead[]>
    );

    // Calculate value for each status group
    for (const [status, statusLeads] of Object.entries(leadsByStatus)) {
      breakdown[status] = await this.calculatePipelineValue(statusLeads);
    }

    return breakdown;
  }
}
