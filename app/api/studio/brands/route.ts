import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { refreshNavigationCache } from "@/lib/services/categoryService";
import { syncProductCurrencies } from "@/lib/utils/currencySync";
import { clearBrandsCache } from "@/lib/services/brandService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const ALLOWED_CREATE_FIELDS = new Set([
  "name",
  "description",
  "long_description",
  "location",
  "price_range",
  "currency",
  "category",
  "categories",
  "image",
  "website",
  "instagram",
  "whatsapp",
  "founded_year",
  "contact_email",
]);

const BRAND_SELECT_FIELDS =
  "id, name, description, long_description, location, price_range, currency, category, categories, image, website, instagram, whatsapp, founded_year, contact_email, rating, updated_at, created_at";

type CreateBrandBody = {
  name: string;
  contact_email?: string;
  description?: string;
  long_description?: string;
  location?: string;
  price_range?: string;
  currency?: string;
  category?: string;
  categories?: string[];
  image?: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
  founded_year?: string | number;
};

function normalizeText(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

async function requireAdminOrSuperAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return { ok: false as const, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return { ok: true as const, userId: user.id };
}

function validateCreateBody(raw: unknown): { ok: true; data: CreateBrandBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid request body" };
  }
  const body = raw as Record<string, unknown>;
  const invalidKeys = Object.keys(body).filter((key) => !ALLOWED_CREATE_FIELDS.has(key));
  if (invalidKeys.length > 0) {
    return { ok: false, error: "Request contains unsupported fields" };
  }
  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return { ok: false, error: "Brand name is required" };
  }
  if (body.categories !== undefined) {
    if (!Array.isArray(body.categories) || !body.categories.every((v) => typeof v === "string")) {
      return { ok: false, error: "Categories must be an array of strings" };
    }
  }
  return { ok: true, data: body as unknown as CreateBrandBody };
}

export async function POST(request: NextRequest) {
  try {
    const authz = await requireAdminOrSuperAdmin();
    if (!authz.ok) return authz.response;

    const parsed = validateCreateBody(await request.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const body = parsed.data;
    const brandData = {
      id: randomUUID(),
      name: normalizeText(body.name, 100),
      contact_email: normalizeText(body.contact_email, 255),
      description: normalizeText(body.description, 150),
      long_description: normalizeText(body.long_description, 2000),
      location: normalizeText(body.location, 120),
      price_range: normalizeText(body.price_range, 120),
      currency: normalizeText(body.currency, 8),
      category: normalizeText(body.category, 120),
      categories: body.categories?.map((c) => c.trim()).filter(Boolean) ?? [],
      image: normalizeText(body.image, 2000),
      website: normalizeText(body.website, 2000),
      instagram: normalizeText(body.instagram, 120),
      whatsapp: normalizeText(body.whatsapp, 120),
      founded_year:
        body.founded_year !== undefined && body.founded_year !== null
          ? String(body.founded_year).trim().slice(0, 4)
          : undefined,
      rating: 5.0,
    };

    // Create the brand
    const { data: newBrand, error: brandError } = await supabaseAdmin
      .from("brands")
      .insert(brandData)
      .select(BRAND_SELECT_FIELDS)
      .single();

    if (brandError) {
      console.error("❌ Database error creating brand:", brandError.code);
      return NextResponse.json(
        { error: "Failed to create brand" },
        { status: 500 }
      );
    }

    // If the brand has an image, also create an entry in the brand_images table
    if (newBrand.image) {
      try {
        // Extract storage path from the image URL
        const imageUrl = newBrand.image;
        let storagePath = imageUrl;

        // If it's a full Supabase URL, extract just the path
        if (imageUrl.includes("/storage/v1/object/public/brand-assets/")) {
          storagePath = imageUrl.split(
            "/storage/v1/object/public/brand-assets/"
          )[1];
        }

        // Create entry in brand_images table
        const { error: imageError } = await supabaseAdmin
          .from("brand_images")
          .insert({
            brand_id: newBrand.id,
            role: "cover",
            storage_path: storagePath,
          })
          .select("id")
          .single();

        if (imageError) {
          console.warn(
            "⚠️ Warning: Failed to create brand_image entry:",
            imageError.code
          );
        }
      } catch (imageSyncError) {
        console.warn("⚠️ Warning: Image sync failed:", imageSyncError);
        // Don't fail the entire operation for this
      }
    }

    // Auto-assign the new brand to all super admins
    const { data: superAdmins, error: superAdminsError } = await supabaseAdmin
      .from("profiles")
      .select("id, owned_brands")
      .eq("role", "super_admin");

    if (superAdminsError) {
      console.error("Error fetching super admins:", superAdminsError.code);
    } else if (superAdmins && superAdmins.length > 0) {
      await Promise.all(
        superAdmins.map(async (admin) => {
          const currentBrands = Array.isArray(admin.owned_brands)
            ? admin.owned_brands
            : [];
          const updatedBrands = Array.from(new Set([...currentBrands, newBrand.id]));
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ owned_brands: updatedBrands })
            .eq("id", admin.id);
          if (updateError) {
            console.error("Error updating super admin brand ownership:", updateError.code);
          }
        })
      );
    }

    // Refresh navigation cache to update dropdowns
    await refreshNavigationCache();

    // If the brand has a currency, sync any existing products to use it
    if (newBrand.currency) {
      try {
        const syncResult = await syncProductCurrencies(
          newBrand.id,
          newBrand.currency
        );
        if (!syncResult.success) {
          console.warn(
            `⚠️ Warning: Product currency sync failed: ${syncResult.error}`
          );
        }
      } catch (syncError) {
        console.warn("⚠️ Warning: Product currency sync failed:", syncError);
      }
    }

    // Clear the brands cache to ensure fresh data after creation
    try {
      clearBrandsCache();
    } catch (cacheError) {
      console.warn("⚠️ Warning: Failed to clear brands cache:", cacheError);
      // Don't fail the entire operation for this
    }

    return NextResponse.json({ brand: newBrand }, { status: 201 });
  } catch (error) {
    console.error("Error in brand creation route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
