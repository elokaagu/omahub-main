import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

const TAILOR_SELECT_FIELDS = `
  id,
  brand_id,
  title,
  image,
  description,
  specialties,
  price_range,
  consultation_fee,
  lead_time,
  created_at,
  updated_at,
  brand:brands(id, name, location, is_verified, category)
`;

const ALLOWED_TAILOR_CREATE_FIELDS = new Set([
  "brand_id",
  "title",
  "image",
  "description",
  "specialties",
  "price_range",
  "consultation_fee",
  "lead_time",
]);

type TailorAccess =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
      isAdmin: boolean;
      ownedBrands: string[];
    }
  | { ok: false; response: NextResponse };

async function requireStudioTailorAccess(): Promise<TailorAccess> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
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
      response: NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 }),
    };
  }

  const role = profile.role ?? "";
  if (!["brand_admin", "admin", "super_admin"].includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Access denied" }, { status: 403 }),
    };
  }

  const ownedBrands = Array.isArray(profile.owned_brands) ? profile.owned_brands : [];
  const isAdmin = ["admin", "super_admin"].includes(role);
  if (!isAdmin && ownedBrands.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No accessible brands" }, { status: 403 }),
    };
  }

  return { ok: true, supabase, isAdmin, ownedBrands };
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireStudioTailorAccess();
    if (!access.ok) return access.response;
    const { supabase, isAdmin, ownedBrands } = access;

    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const tailorData = rawBody as Record<string, unknown>;
    const invalidKeys = Object.keys(tailorData).filter(
      (key) => !ALLOWED_TAILOR_CREATE_FIELDS.has(key)
    );
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: "Request contains unsupported fields" },
        { status: 400 }
      );
    }

    if (typeof tailorData.brand_id !== "string" || !tailorData.brand_id.trim()) {
      return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
    }
    if (typeof tailorData.title !== "string" || !tailorData.title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (typeof tailorData.image !== "string" || !tailorData.image.trim()) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }
    if (
      tailorData.specialties !== undefined &&
      !(
        Array.isArray(tailorData.specialties) &&
        tailorData.specialties.every((s) => typeof s === "string")
      )
    ) {
      return NextResponse.json(
        { error: "specialties must be an array of strings" },
        { status: 400 }
      );
    }

    if (!isAdmin && !ownedBrands.includes(tailorData.brand_id)) {
      return NextResponse.json(
        { error: "Insufficient permissions for this brand" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("tailors")
      .insert({
        brand_id: tailorData.brand_id,
        title: tailorData.title,
        image: tailorData.image,
        description:
          typeof tailorData.description === "string"
            ? tailorData.description.trim()
            : null,
        specialties: tailorData.specialties ?? [],
        price_range:
          typeof tailorData.price_range === "string"
            ? tailorData.price_range.trim()
            : null,
        consultation_fee:
          typeof tailorData.consultation_fee === "number"
            ? tailorData.consultation_fee
            : null,
        lead_time:
          typeof tailorData.lead_time === "string"
            ? tailorData.lead_time.trim()
            : null,
      })
      .select(TAILOR_SELECT_FIELDS)
      .single();

    if (error) {
      console.error("Error creating tailor:", error.code);
      return NextResponse.json(
        { error: "Failed to create tailor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tailor: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/studio/tailors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const access = await requireStudioTailorAccess();
    if (!access.ok) return access.response;
    const { supabase, isAdmin, ownedBrands } = access;

    let query = supabase
      .from("tailors")
      .select(TAILOR_SELECT_FIELDS)
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.in("brand_id", ownedBrands);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tailors:", error.code);
      return NextResponse.json(
        { error: "Failed to fetch tailors" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tailors: data }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/studio/tailors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
