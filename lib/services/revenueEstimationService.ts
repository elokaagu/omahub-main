import { createClient } from "@/lib/supabase-unified";

interface BrandPricingData {
  total_products: number;
  price_range: {
    min: number;
    max: number;
    average: number;
  };
  category_averages: Record<string, number>;
  custom_vs_ready: {
    custom_avg: number;
    ready_avg: number;
  };
  has_pricing_data: boolean;
}

interface LeadAnalysisResult {
  estimated_value: number;
  confidence_score: number;
  pricing_source: "brand_products" | "category_average" | "industry_fallback";
  breakdown: {
    base_value: number;
    project_multiplier: number;
    quantity_multiplier: number;
    urgency_multiplier: number;
    luxury_multiplier: number;
    final_value: number;
  };
  recommended_follow_up: string;
}

/**
 * Enhanced revenue estimation using real brand product pricing data
 */
export class RevenueEstimationService {
  private supabase = createClient();

  /**
   * Estimate lead revenue potential using brand's actual product pricing
   */
  async estimateLeadRevenue(
    brandId: string,
    message: string,
    inquiryType: string,
    customerDetails?: {
      company_name?: string;
      location?: string;
      referral_source?: string;
    }
  ): Promise<LeadAnalysisResult> {
    try {
      // Get brand's actual product pricing data
      const brandPricing = await this.fetchBrandPricingData(brandId);

      // Get brand category for context
      const brandInfo = await this.fetchBrandInfo(brandId);

      // Analyze the inquiry message
      const messageAnalysis = this.analyzeInquiryMessage(message, inquiryType);

      // Calculate base value using real pricing data
      const baseValue = this.calculateBaseValue(
        brandPricing,
        brandInfo,
        messageAnalysis
      );

      // Apply intelligent multipliers
      const multipliers = this.calculateMultipliers(
        message,
        inquiryType,
        customerDetails
      );

      // Calculate final estimated value
      const finalValue = this.applyMultipliers(baseValue, multipliers);

      // Determine confidence score
      const confidenceScore = this.calculateConfidenceScore(
        brandPricing,
        messageAnalysis,
        multipliers
      );

      // Generate follow-up recommendation
      const followUpRecommendation = this.generateFollowUpRecommendation(
        finalValue,
        messageAnalysis,
        brandPricing
      );

      return {
        estimated_value: Math.round(finalValue),
        confidence_score: Math.round(confidenceScore),
        pricing_source: brandPricing.has_pricing_data
          ? "brand_products"
          : "category_average",
        breakdown: {
          base_value: Math.round(baseValue),
          project_multiplier: multipliers.project,
          quantity_multiplier: multipliers.quantity,
          urgency_multiplier: multipliers.urgency,
          luxury_multiplier: multipliers.luxury,
          final_value: Math.round(finalValue),
        },
        recommended_follow_up: followUpRecommendation,
      };
    } catch (error) {
      console.error("Revenue estimation error:", error);
      // Fallback to basic estimation
      return this.fallbackEstimation(message, inquiryType);
    }
  }

  /**
   * Fetch brand's actual product pricing data
   */
  private async fetchBrandPricingData(
    brandId: string
  ): Promise<BrandPricingData> {
    try {
      const response = await fetch(`/api/brands/${brandId}/products`);
      if (!response.ok) {
        throw new Error("Failed to fetch brand products");
      }

      const data = await response.json();
      return data.pricing_stats;
    } catch (error) {
      console.error("Error fetching brand pricing:", error);
      return {
        total_products: 0,
        price_range: { min: 0, max: 0, average: 0 },
        category_averages: {},
        custom_vs_ready: { custom_avg: 0, ready_avg: 0 },
        has_pricing_data: false,
      };
    }
  }

  /**
   * Fetch brand information for context
   */
  private async fetchBrandInfo(brandId: string) {
    try {
      const { data: brand, error } = await this.supabase
        .from("brands")
        .select("name, category, price_range, location")
        .eq("id", brandId)
        .single();

      if (error) throw error;
      return brand;
    } catch (error) {
      console.error("Error fetching brand info:", error);
      return { name: "", category: "", price_range: "", location: "" };
    }
  }

  /**
   * Analyze inquiry message for project details
   */
  private analyzeInquiryMessage(message: string, inquiryType: string) {
    const lowerMessage = message.toLowerCase();

    // Extract project type
    const projectTypes = {
      wedding: ["wedding", "bride", "bridal", "groom", "ceremony"],
      evening: ["evening", "gala", "formal", "black tie", "cocktail"],
      red_carpet: ["red carpet", "premiere", "awards", "celebrity"],
      corporate: ["corporate", "business", "office", "professional"],
      casual: ["casual", "everyday", "weekend", "comfortable"],
      custom: ["custom", "bespoke", "tailored", "made to measure"],
      alteration: ["alteration", "adjustment", "fitting", "resize"],
      consultation: ["consultation", "advice", "styling", "wardrobe"],
    };

    let detectedProjectType = "general";
    for (const [type, keywords] of Object.entries(projectTypes)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        detectedProjectType = type;
        break;
      }
    }

    // Extract quantity indicators
    const quantityMatch = lowerMessage.match(
      /(\d+)\s*(piece|item|dress|suit|outfit|garment)/i
    );
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

    // Extract budget if mentioned
    const budgetPatterns = [
      /\$[\d,]+/g,
      /£[\d,]+/g,
      /€[\d,]+/g,
      /budget.*?(\d+)/gi,
      /spend.*?(\d+)/gi,
    ];

    let mentionedBudget = 0;
    for (const pattern of budgetPatterns) {
      const matches = message.match(pattern);
      if (matches) {
        const budgetStr = matches[0].replace(/[$£€,]/g, "").match(/\d+/);
        if (budgetStr) {
          mentionedBudget = parseInt(budgetStr[0]);
          break;
        }
      }
    }

    // Extract timeline urgency
    const urgencyKeywords = {
      urgent: ["urgent", "asap", "rush", "emergency"],
      high: ["next week", "this month", "soon"],
      normal: ["next month", "few months", "planning"],
      low: ["next year", "future", "eventually"],
    };

    let urgencyLevel = "normal";
    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        urgencyLevel = level;
        break;
      }
    }

    return {
      project_type: detectedProjectType,
      quantity,
      mentioned_budget: mentionedBudget,
      urgency_level: urgencyLevel,
      message_length: message.length,
      has_specific_details:
        lowerMessage.includes("fabric") ||
        lowerMessage.includes("color") ||
        lowerMessage.includes("style"),
    };
  }

  /**
   * Calculate base value using brand's actual pricing data
   */
  private calculateBaseValue(
    brandPricing: BrandPricingData,
    brandInfo: any,
    messageAnalysis: any
  ): number {
    // If brand has real pricing data, use it
    if (brandPricing.has_pricing_data && brandPricing.price_range.average > 0) {
      // Use category-specific average if available
      const categoryAvg =
        brandPricing.category_averages[messageAnalysis.project_type];
      if (categoryAvg && categoryAvg > 0) {
        return categoryAvg;
      }

      // Use custom vs ready-to-wear pricing
      if (
        messageAnalysis.project_type === "custom" &&
        brandPricing.custom_vs_ready.custom_avg > 0
      ) {
        return brandPricing.custom_vs_ready.custom_avg;
      }

      // Use overall average
      return brandPricing.price_range.average;
    }

    // Fallback to brand category-based estimation
    return this.getCategoryBaseValue(
      brandInfo.category,
      messageAnalysis.project_type
    );
  }

  /**
   * Get category-based base values when no product data is available
   */
  private getCategoryBaseValue(
    brandCategory: string,
    projectType: string
  ): number {
    const categoryBases: Record<string, number> = {
      luxury: 5000,
      "haute couture": 8000,
      bridal: 4000,
      "evening wear": 3000,
      formal: 2500,
      "ready-to-wear": 2000,
      contemporary: 1800,
      accessories: 800,
      sustainable: 2200,
      streetwear: 1200,
    };

    const projectMultipliers: Record<string, number> = {
      wedding: 2.5,
      red_carpet: 3.0,
      evening: 1.8,
      corporate: 1.4,
      custom: 2.0,
      consultation: 0.3,
      alteration: 0.4,
    };

    const baseValue = categoryBases[brandCategory?.toLowerCase()] || 2000;
    const multiplier = projectMultipliers[projectType] || 1.0;

    return baseValue * multiplier;
  }

  /**
   * Calculate intelligent multipliers based on inquiry analysis
   */
  private calculateMultipliers(
    message: string,
    inquiryType: string,
    customerDetails?: any
  ) {
    const lowerMessage = message.toLowerCase();

    // Project complexity multiplier
    let projectMultiplier = 1.0;
    if (lowerMessage.includes("complex") || lowerMessage.includes("detailed")) {
      projectMultiplier = 1.3;
    }

    // Quantity multiplier (with diminishing returns)
    const quantityMatch = lowerMessage.match(
      /(\d+)\s*(piece|item|dress|suit)/i
    );
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    const quantityMultiplier =
      quantity > 1 ? Math.min(1 + (quantity - 1) * 0.8, 5.0) : 1.0;

    // Urgency multiplier
    let urgencyMultiplier = 1.0;
    if (lowerMessage.includes("urgent") || lowerMessage.includes("asap")) {
      urgencyMultiplier = 1.4;
    } else if (lowerMessage.includes("rush")) {
      urgencyMultiplier = 1.2;
    }

    // Luxury indicators multiplier
    const luxuryKeywords = [
      "luxury",
      "premium",
      "high-end",
      "exclusive",
      "designer",
    ];
    const luxuryMultiplier = luxuryKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    )
      ? 1.5
      : 1.0;

    // Corporate client multiplier
    const corporateMultiplier = customerDetails?.company_name ? 1.2 : 1.0;

    return {
      project: projectMultiplier,
      quantity: quantityMultiplier,
      urgency: urgencyMultiplier,
      luxury: luxuryMultiplier,
      corporate: corporateMultiplier,
    };
  }

  /**
   * Apply multipliers to base value
   */
  private applyMultipliers(baseValue: number, multipliers: any): number {
    return (
      baseValue *
      multipliers.project *
      multipliers.quantity *
      multipliers.urgency *
      multipliers.luxury *
      multipliers.corporate
    );
  }

  /**
   * Calculate confidence score based on available data
   */
  private calculateConfidenceScore(
    brandPricing: BrandPricingData,
    messageAnalysis: any,
    multipliers: {
      project: number;
      quantity: number;
      urgency: number;
      luxury: number;
      corporate: number;
    }
  ): number {
    let confidence = 50; // Base confidence

    // Higher confidence if we have real pricing data
    if (brandPricing.has_pricing_data) {
      confidence += 30;
    }

    // Higher confidence for detailed messages
    if (messageAnalysis.has_specific_details) {
      confidence += 15;
    }

    // Higher confidence if mentioned budget aligns with estimate
    if (messageAnalysis.mentioned_budget > 0) {
      confidence += 20;
    }

    // Lower confidence for extreme multipliers
    const totalMultiplier = Object.values(multipliers).reduce(
      (a: number, b: number) => a * b,
      1
    );
    if (totalMultiplier > 3.0) {
      confidence -= 15;
    }

    return Math.min(Math.max(confidence, 20), 95);
  }

  /**
   * Generate follow-up recommendation based on estimation
   */
  private generateFollowUpRecommendation(
    estimatedValue: number,
    messageAnalysis: any,
    brandPricing: BrandPricingData
  ): string {
    if (estimatedValue > 10000) {
      return "High-value lead - Schedule consultation within 24 hours";
    } else if (estimatedValue > 5000) {
      return "Significant opportunity - Send detailed portfolio and pricing guide";
    } else if (messageAnalysis.urgency_level === "urgent") {
      return "Urgent inquiry - Respond immediately with availability";
    } else if (!brandPricing.has_pricing_data) {
      return "Add product pricing data to improve lead estimation accuracy";
    } else {
      return "Standard follow-up - Respond within business hours with consultation offer";
    }
  }

  /**
   * Fallback estimation when API fails
   */
  private fallbackEstimation(
    message: string,
    inquiryType: string
  ): LeadAnalysisResult {
    const baseValue = 2000;
    const lowerMessage = message.toLowerCase();

    let multiplier = 1.0;
    if (lowerMessage.includes("wedding")) multiplier = 2.5;
    else if (lowerMessage.includes("luxury")) multiplier = 2.0;
    else if (lowerMessage.includes("urgent")) multiplier = 1.3;

    const finalValue = baseValue * multiplier;

    return {
      estimated_value: Math.round(finalValue),
      confidence_score: 40,
      pricing_source: "industry_fallback",
      breakdown: {
        base_value: baseValue,
        project_multiplier: multiplier,
        quantity_multiplier: 1,
        urgency_multiplier: 1,
        luxury_multiplier: 1,
        final_value: Math.round(finalValue),
      },
      recommended_follow_up: "Standard follow-up recommended",
    };
  }
}

/**
 * Convenience function to estimate lead revenue
 */
export async function estimateLeadRevenue(
  brandId: string,
  message: string,
  inquiryType: string,
  customerDetails?: any
): Promise<LeadAnalysisResult> {
  const service = new RevenueEstimationService();
  return service.estimateLeadRevenue(
    brandId,
    message,
    inquiryType,
    customerDetails
  );
}
