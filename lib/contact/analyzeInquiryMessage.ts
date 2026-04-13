/**
 * Heuristic lead enrichment from free-text (budget, timeline, type).
 * Used when persisting leads from public contact flows.
 */
export function analyzeInquiryMessage(
  message: string,
  _inquiryType: string,
  brandCategory?: string
) {
  const lowerMessage = message.toLowerCase();

  let baseValue = 2000;
  if (brandCategory) {
    switch (brandCategory.toLowerCase()) {
      case "luxury":
      case "haute couture":
        baseValue = 5000;
        break;
      case "bridal":
      case "wedding":
        baseValue = 4000;
        break;
      case "evening wear":
      case "formal":
        baseValue = 3000;
        break;
      case "ready-to-wear":
      case "contemporary":
        baseValue = 2500;
        break;
      case "accessories":
        baseValue = 1500;
        break;
      case "sustainable":
      case "ethical":
        baseValue = 2800;
        break;
      default:
        baseValue = 2000;
    }
  }

  let estimatedValue = baseValue;
  let priority = "normal";
  let projectTimeline = "3-6 months";
  let leadType = "inquiry";

  const budgetPatterns = [
    /\$[\d,]+/g,
    /£[\d,]+/g,
    /€[\d,]+/g,
    /budget.*?(\d+)/gi,
    /spend.*?(\d+)/gi,
    /around.*?(\d+)/gi,
    /up to.*?(\d+)/gi,
  ];

  for (const pattern of budgetPatterns) {
    const matches = message.match(pattern);
    if (matches) {
      for (const match of matches) {
        const budgetStr = match.replace(/[$£€,]/g, "").match(/\d+/);
        if (budgetStr) {
          const budgetNum = parseInt(budgetStr[0], 10);
          if (!isNaN(budgetNum) && budgetNum > 100) {
            estimatedValue = Math.max(estimatedValue, budgetNum);
            break;
          }
        }
      }
    }
  }

  const projectKeywords = {
    wedding: {
      multiplier: 2.5,
      minValue: 5000,
      priority: "high",
      type: "booking_intent",
    },
    bridal: {
      multiplier: 2.5,
      minValue: 4500,
      priority: "high",
      type: "booking_intent",
    },
    "red carpet": {
      multiplier: 3.0,
      minValue: 8000,
      priority: "urgent",
      type: "booking_intent",
    },
    gala: {
      multiplier: 2.2,
      minValue: 4000,
      priority: "high",
      type: "booking_intent",
    },
    corporate: {
      multiplier: 2.0,
      minValue: 4000,
      priority: "high",
      type: "booking_intent",
    },
    event: {
      multiplier: 1.8,
      minValue: 3000,
      priority: "high",
      type: "booking_intent",
    },
    party: {
      multiplier: 1.5,
      minValue: 2500,
      priority: "normal",
      type: "booking_intent",
    },
    photoshoot: {
      multiplier: 1.3,
      minValue: 1500,
      priority: "normal",
      type: "booking_intent",
    },
    custom: {
      multiplier: 1.5,
      minValue: 2500,
      priority: "normal",
      type: "booking_intent",
    },
    bespoke: {
      multiplier: 1.8,
      minValue: 3000,
      priority: "normal",
      type: "booking_intent",
    },
    "made to measure": {
      multiplier: 1.6,
      minValue: 2800,
      priority: "normal",
      type: "booking_intent",
    },
    couture: {
      multiplier: 2.5,
      minValue: 5000,
      priority: "high",
      type: "booking_intent",
    },
    wholesale: {
      multiplier: 3.0,
      minValue: 10000,
      priority: "high",
      type: "quote_request",
    },
    bulk: {
      multiplier: 2.5,
      minValue: 8000,
      priority: "high",
      type: "quote_request",
    },
    collection: {
      multiplier: 2.0,
      minValue: 6000,
      priority: "normal",
      type: "quote_request",
    },
    consultation: {
      multiplier: 0.3,
      minValue: 500,
      priority: "normal",
      type: "consultation",
    },
    styling: {
      multiplier: 0.8,
      minValue: 1200,
      priority: "normal",
      type: "consultation",
    },
    fitting: {
      multiplier: 0.4,
      minValue: 300,
      priority: "normal",
      type: "consultation",
    },
    quote: {
      multiplier: 1.0,
      minValue: baseValue,
      priority: "normal",
      type: "quote_request",
    },
    price: {
      multiplier: 1.0,
      minValue: baseValue,
      priority: "normal",
      type: "quote_request",
    },
    inquiry: {
      multiplier: 1.0,
      minValue: baseValue,
      priority: "normal",
      type: "inquiry",
    },
  } as const;

  for (const [keyword, config] of Object.entries(projectKeywords)) {
    if (lowerMessage.includes(keyword)) {
      estimatedValue = Math.max(
        estimatedValue * config.multiplier,
        config.minValue
      );
      priority = config.priority;
      leadType = config.type;
      break;
    }
  }

  if (lowerMessage.includes("multiple") || lowerMessage.includes("several")) {
    estimatedValue *= 1.5;
  }
  if (lowerMessage.match(/\d+.*piece/i) || lowerMessage.match(/\d+.*item/i)) {
    const quantityMatch = lowerMessage.match(
      /(\d+).*(?:piece|item|dress|suit|gown)/i
    );
    if (quantityMatch) {
      const quantity = parseInt(quantityMatch[1], 10);
      if (quantity > 1 && quantity <= 20) {
        estimatedValue *= Math.min(quantity, 5);
      }
    }
  }

  if (
    lowerMessage.includes("urgent") ||
    lowerMessage.includes("asap") ||
    lowerMessage.includes("rush")
  ) {
    projectTimeline = "ASAP";
    priority = "urgent";
    estimatedValue *= 1.3;
  } else if (
    lowerMessage.includes("next week") ||
    lowerMessage.includes("this month")
  ) {
    projectTimeline = "1-3 months";
    priority = "high";
    estimatedValue *= 1.1;
  } else if (
    lowerMessage.includes("next month") ||
    lowerMessage.includes("few months")
  ) {
    projectTimeline = "3-6 months";
  } else if (
    lowerMessage.includes("next year") ||
    lowerMessage.includes("planning ahead")
  ) {
    projectTimeline = "6+ months";
  }

  const luxuryKeywords = [
    "luxury",
    "premium",
    "high-end",
    "exclusive",
    "designer",
    "couture",
  ];
  if (luxuryKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    estimatedValue *= 1.4;
    if (priority === "normal") priority = "high";
  }

  const budgetConstraints = [
    "budget",
    "affordable",
    "reasonable",
    "cost-effective",
    "economical",
  ];
  if (
    budgetConstraints.some((keyword) => lowerMessage.includes(keyword)) &&
    !lowerMessage.includes("no budget") &&
    !lowerMessage.includes("unlimited")
  ) {
    estimatedValue *= 0.8;
  }

  if (estimatedValue < 1000) {
    estimatedValue = Math.round(estimatedValue / 50) * 50;
  } else if (estimatedValue < 5000) {
    estimatedValue = Math.round(estimatedValue / 100) * 100;
  } else {
    estimatedValue = Math.round(estimatedValue / 250) * 250;
  }

  estimatedValue = Math.max(estimatedValue, 200);

  return {
    estimatedValue,
    priority,
    projectTimeline,
    leadType,
  };
}
