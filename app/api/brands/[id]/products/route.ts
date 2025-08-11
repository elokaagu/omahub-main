import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  sale_price?: number;
  category: string;
  in_stock: boolean;
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  is_custom: boolean;
  lead_time?: string;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const brandId = params.id;

    // Get brand products with pricing data (excludes portfolio items)
    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        id,
        title,
        description,
        price,
        sale_price,
        category,
        in_stock,
        sizes,
        colors,
        materials,
        is_custom,
        lead_time,
        created_at
      `
      )
      .eq("brand_id", brandId)
      .eq("in_stock", true)
      .neq("service_type", "portfolio") // Exclude portfolio items from public display
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching brand products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Calculate pricing statistics
    const pricingStats = calculatePricingStats(products || []);

    return NextResponse.json({
      products: products || [],
      pricing_stats: pricingStats,
    });
  } catch (error) {
    console.error("Brand products API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculatePricingStats(products: Product[]) {
  if (!products.length) {
    return {
      total_products: 0,
      price_range: { min: 0, max: 0, average: 0 },
      category_averages: {},
      custom_vs_ready: { custom_avg: 0, ready_avg: 0 },
      has_pricing_data: false,
    };
  }

  const prices = products
    .map((p) => p.sale_price || p.price)
    .filter((price) => price > 0)
    .sort((a, b) => a - b);

  if (!prices.length) {
    return {
      total_products: products.length,
      price_range: { min: 0, max: 0, average: 0 },
      category_averages: {},
      custom_vs_ready: { custom_avg: 0, ready_avg: 0 },
      has_pricing_data: false,
    };
  }

  // Calculate category averages
  const categoryAverages: Record<string, number> = {};
  const categoryGroups = products.reduce(
    (acc, product) => {
      const price = product.sale_price || product.price;
      if (price > 0) {
        if (!acc[product.category]) acc[product.category] = [];
        acc[product.category].push(price);
      }
      return acc;
    },
    {} as Record<string, number[]>
  );

  Object.entries(categoryGroups).forEach(([category, categoryPrices]) => {
    categoryAverages[category] =
      categoryPrices.reduce((sum: number, price: number) => sum + price, 0) /
      categoryPrices.length;
  });

  // Calculate custom vs ready-to-wear averages
  const customProducts = products.filter(
    (p) => p.is_custom && (p.sale_price || p.price) > 0
  );
  const readyProducts = products.filter(
    (p) => !p.is_custom && (p.sale_price || p.price) > 0
  );

  const customAvg =
    customProducts.length > 0
      ? customProducts.reduce((sum, p) => sum + (p.sale_price || p.price), 0) /
        customProducts.length
      : 0;

  const readyAvg =
    readyProducts.length > 0
      ? readyProducts.reduce((sum, p) => sum + (p.sale_price || p.price), 0) /
        readyProducts.length
      : 0;

  return {
    total_products: products.length,
    price_range: {
      min: prices[0],
      max: prices[prices.length - 1],
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    },
    category_averages: categoryAverages,
    custom_vs_ready: {
      custom_avg: customAvg,
      ready_avg: readyAvg,
    },
    has_pricing_data: true,
  };
}
