import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

const PRODUCT_SELECT_FIELDS = `
  id,
  title,
  slug,
  description,
  image,
  images,
  price,
  currency,
  category,
  service_type,
  brand_id,
  created_at,
  updated_at,
  created_by,
  brand:brands(id, name, category, location)
`;

const ALLOWED_PRODUCT_CREATE_FIELDS = new Set([
  "brand_id",
  "title",
  "slug",
  "description",
  "image",
  "images",
  "price",
  "currency",
  "category",
  "service_type",
  "stock_quantity",
  "is_available",
  "metadata",
]);

type AccessResult =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
      userId: string;
      role: string;
      ownedBrands: string[];
      isAdmin: boolean;
    }
  | { ok: false; response: NextResponse };

async function requireStudioProductAccess(): Promise<AccessResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, owned_brands")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      ),
    };
  }

  const role = profile.role ?? "";
  if (!["brand_admin", "admin", "super_admin"].includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Access denied" }, { status: 403 }),
    };
  }

  const ownedBrands = Array.isArray(profile.owned_brands)
    ? profile.owned_brands
    : [];
  const isAdmin = ["admin", "super_admin"].includes(role);

  if (!isAdmin && ownedBrands.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No accessible brands" }, { status: 403 }),
    };
  }

  return { ok: true, supabase, userId: user.id, role, ownedBrands, isAdmin };
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireStudioProductAccess();
    if (!access.ok) return access.response;
    const { supabase, isAdmin, ownedBrands } = access;

    const url = new URL(request.url);
    const pageRaw = Number.parseInt(url.searchParams.get("page") || "1", 10);
    const limitRaw = Number.parseInt(url.searchParams.get("limit") || "50", 10);
    const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1;
    const limit = Number.isFinite(limitRaw)
      ? Math.min(200, Math.max(1, limitRaw))
      : 50;
    const offset = (page - 1) * limit;

    // Build query based on user role
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT_FIELDS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // If not super admin, filter by owned brands
    if (!isAdmin) {
      query = query.in("brand_id", ownedBrands);
    }

    const { data: products, error, count } = await query;

    if (error) {
      console.error("Error fetching products:", error.code);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Normalize product images to ensure first image is always the main image
    const normalizedProducts = (products || []).map((item: any) => {
      if (Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
        return { ...item, image: item.images[0] };
      }
      return item;
    });
    return NextResponse.json({
      products: normalizedProducts,
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Products API error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireStudioProductAccess();
    if (!access.ok) return access.response;
    const { supabase, userId, isAdmin, ownedBrands } = access;

    // Get the product data
    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const productData = rawBody as Record<string, unknown>;
    const invalidKeys = Object.keys(productData).filter(
      (key) => !ALLOWED_PRODUCT_CREATE_FIELDS.has(key)
    );
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: "Request contains unsupported fields" },
        { status: 400 }
      );
    }
    if (typeof productData.brand_id !== "string" || !productData.brand_id.trim()) {
      return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
    }
    if (typeof productData.title !== "string" || !productData.title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (
      productData.images !== undefined &&
      !(
        Array.isArray(productData.images) &&
        productData.images.every((img) => typeof img === "string")
      )
    ) {
      return NextResponse.json(
        { error: "images must be an array of strings" },
        { status: 400 }
      );
    }

    // Check if user has permission to create products for this brand
    const isBrandOwner = ownedBrands.includes(productData.brand_id as string);

    if (!isAdmin && !isBrandOwner) {
      return NextResponse.json(
        { error: "Insufficient permissions to create products for this brand" },
        { status: 403 }
      );
    }

    // Add created_by and timestamps
    const newProduct = {
      ...productData,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create the product
    const { data: createdProduct, error } = await supabase
      .from("products")
      .insert(newProduct)
      .select(PRODUCT_SELECT_FIELDS)
      .single();

    if (error) {
      console.error("Error creating product:", error.code);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: createdProduct,
    });
  } catch (error) {
    console.error(
      "Product creation API error:",
      error instanceof Error ? error.name : "unknown"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
