import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import {
  parsePublicBrandIdParam,
  parseProductListLimit,
} from "@/lib/validation/brandIdParam";

export const dynamic = "force-dynamic";

/** Row shape from explicit select (nullable matches DB). */
interface ProductRow {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  sale_price: number | null;
  category: string | null;
  in_stock: boolean | null;
  sizes: string[] | null;
  colors: string[] | null;
  materials: string[] | null;
  is_custom: boolean | null;
  lead_time: string | null;
  created_at: string;
  service_type?: string | null;
}

type PublicProduct = Omit<ProductRow, "service_type">;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function effectivePrice(p: ProductRow): number {
  const v = p.sale_price ?? p.price ?? 0;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idParsed = parsePublicBrandIdParam(params.id);
    if (!idParsed.ok) {
      return NextResponse.json({ error: idParsed.error }, { status: 400 });
    }
    const brandId = idParsed.value;

    const limitParsed = parseProductListLimit(request.nextUrl.searchParams);
    if (!limitParsed.ok) {
      return NextResponse.json({ error: limitParsed.error }, { status: 400 });
    }
    const limit = limitParsed.value;

    const supabase = await createServerSupabaseClient();

    // In-stock sellable rows only; exclude portfolio (`service_type` = portfolio).
    // Include rows where `service_type` is null (legacy) or any non-portfolio type.
    let query = supabase
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
        created_at,
        service_type
      `
      )
      .eq("brand_id", brandId)
      .eq("in_stock", true)
      .or("service_type.is.null,service_type.neq.portfolio")
      .order("created_at", { ascending: false });

    if (limit != null) {
      query = query.limit(limit);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error(
        JSON.stringify({
          event: "brand_products_fetch_failed",
          code: error.code,
          message: error.message,
        })
      );
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    const list = (products ?? []) as ProductRow[];
    const pricingStats = calculatePricingStats(list);

    let brandExists = list.length > 0;
    if (!brandExists) {
      const { data: brandRow, error: brandErr } = await supabase
        .from("brands")
        .select("id")
        .eq("id", brandId)
        .maybeSingle();
      if (!brandErr && brandRow) {
        brandExists = true;
      }
    }

    // Strip `service_type` from public payload (used only for filtering).
    const publicProducts: PublicProduct[] = list.map(
      ({ service_type: _st, ...rest }) => rest
    );

    return NextResponse.json({
      products: publicProducts,
      pricing_stats: pricingStats,
      brand_exists: brandExists,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "brand_products_unexpected",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculatePricingStats(products: ProductRow[]) {
  if (!products.length) {
    return {
      total_products: 0,
      price_range: { min: 0, max: 0, average: 0 },
      category_averages: {} as Record<string, number>,
      custom_vs_ready: { custom_avg: 0, ready_avg: 0 },
      has_pricing_data: false,
    };
  }

  const prices = products
    .map((p) => effectivePrice(p))
    .filter((price) => price > 0)
    .sort((a, b) => a - b);

  if (!prices.length) {
    return {
      total_products: products.length,
      price_range: { min: 0, max: 0, average: 0 },
      category_averages: {} as Record<string, number>,
      custom_vs_ready: { custom_avg: 0, ready_avg: 0 },
      has_pricing_data: false,
    };
  }

  const categoryAverages: Record<string, number> = {};
  const categoryGroups = products.reduce(
    (acc, product) => {
      const price = effectivePrice(product);
      if (price > 0) {
        const cat = product.category?.trim() || "uncategorized";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(price);
      }
      return acc;
    },
    {} as Record<string, number[]>
  );

  Object.entries(categoryGroups).forEach(([category, categoryPrices]) => {
    categoryAverages[category] = roundMoney(
      categoryPrices.reduce((sum, price) => sum + price, 0) /
        categoryPrices.length
    );
  });

  const customProducts = products.filter(
    (p) => p.is_custom && effectivePrice(p) > 0
  );
  const readyProducts = products.filter(
    (p) => !p.is_custom && effectivePrice(p) > 0
  );

  const customAvg =
    customProducts.length > 0
      ? roundMoney(
          customProducts.reduce((sum, p) => sum + effectivePrice(p), 0) /
            customProducts.length
        )
      : 0;

  const readyAvg =
    readyProducts.length > 0
      ? roundMoney(
          readyProducts.reduce((sum, p) => sum + effectivePrice(p), 0) /
            readyProducts.length
        )
      : 0;

  return {
    total_products: products.length,
    price_range: {
      min: roundMoney(prices[0]),
      max: roundMoney(prices[prices.length - 1]),
      average: roundMoney(
        prices.reduce((sum, price) => sum + price, 0) / prices.length
      ),
    },
    category_averages: categoryAverages,
    custom_vs_ready: {
      custom_avg: customAvg,
      ready_avg: readyAvg,
    },
    has_pricing_data: true,
  };
}
