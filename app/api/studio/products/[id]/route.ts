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
  brand:brands(id, name, category, location)
`;

type AccessResult =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
      productId: string;
      isAdmin: boolean;
    }
  | { ok: false; response: NextResponse };

async function requireProductStudioAccess(productId: string): Promise<AccessResult> {
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

  const isAdmin = ["admin", "super_admin"].includes(profile.role ?? "");
  const ownedBrands = Array.isArray(profile.owned_brands) ? profile.owned_brands : [];

  if (!isAdmin && ownedBrands.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, brand_id")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Product not found" }, { status: 404 }),
    };
  }

  const isBrandOwner = ownedBrands.includes(product.brand_id);
  if (!isAdmin && !isBrandOwner) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, supabase, productId, isAdmin };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const access = await requireProductStudioAccess(productId);
    if (!access.ok) return access.response;

    const { data: product, error } = await access.supabase
      .from("products")
      .select(PRODUCT_SELECT_FIELDS)
      .eq("id", productId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const access = await requireProductStudioAccess(productId);
    if (!access.ok) return access.response;

    // Delete the product
    const { error: deleteError } = await access.supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
