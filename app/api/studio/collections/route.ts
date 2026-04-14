import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { getAdminClient } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

const COLLECTION_SELECT_FIELDS = `
  id,
  title,
  description,
  image,
  brand_id,
  created_at,
  updated_at,
  brand:brands(id, name)
`;

const COLLECTION_ID_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProfileRow = { role: string | null; owned_brands: string[] | null };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

async function requireStudioCollectionReadAccess() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return { ok: false as const, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const adminClient = await getAdminClient();
  if (!adminClient) {
    return { ok: false as const, response: NextResponse.json({ error: "Internal server error" }, { status: 500 }) };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role, owned_brands")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { ok: false as const, response: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }) };
  }

  const typedProfile = profile as ProfileRow;
  if (!["admin", "super_admin", "brand_admin"].includes(typedProfile.role ?? "")) {
    return { ok: false as const, response: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }) };
  }

  return { ok: true as const, adminClient, profile: typedProfile };
}

export async function GET() {
  try {
    const authz = await requireStudioCollectionReadAccess();
    if (!authz.ok) return authz.response;

    const { data: collections, error } = await authz.adminClient
      .from("catalogues")
      .select(COLLECTION_SELECT_FIELDS)
      .order("title");

    if (error) {
      console.error("Error fetching collections:", error.code);
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    const profile = authz.profile;
    const isAdmin = ["admin", "super_admin"].includes(profile.role ?? "");
    const visibleCollections = isAdmin
      ? collections ?? []
      : (collections ?? []).filter((c) =>
          (profile.owned_brands ?? []).includes(
            (c as { brand_id: string | null }).brand_id ?? ""
          )
        );

    return NextResponse.json({ collections: visibleCollections });
  } catch (error) {
    console.error("Unexpected error in collections GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authz = await requireStudioCollectionReadAccess();
    if (!authz.ok) return authz.response;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { title, description, brand_id, image } = body as {
      title?: unknown;
      description?: unknown;
      brand_id?: unknown;
      image?: unknown;
    };

    // Validate required fields
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Collection title is required" },
        { status: 400 }
      );
    }

    if (!isValidUuid(brand_id)) {
      return NextResponse.json(
        { error: "Valid brand ID is required" },
        { status: 400 }
      );
    }

    if (typeof image !== "string" || !image.trim()) {
      return NextResponse.json(
        { error: "Collection image is required" },
        { status: 400 }
      );
    }

    if (typeof description !== "undefined" && description !== null && typeof description !== "string") {
      return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
    }

    const titleTrimmed = title.trim();
    if (titleTrimmed.length > 120) {
      return NextResponse.json({ error: "Collection title is too long" }, { status: 400 });
    }

    const imageTrimmed = image.trim();
    if (imageTrimmed.length > 2000) {
      return NextResponse.json({ error: "Collection image value is too long" }, { status: 400 });
    }

    const profile = authz.profile;
    const isAdmin = ["admin", "super_admin"].includes(profile.role ?? "");
    if (!isAdmin && !(profile.owned_brands ?? []).includes(brand_id)) {
      return NextResponse.json(
        { error: "Insufficient permissions for this brand" },
        { status: 403 }
      );
    }

    // Ensure target brand exists
    const { data: brand, error: brandError } = await authz.adminClient
      .from("brands")
      .select("id")
      .eq("id", brand_id)
      .maybeSingle();
    if (brandError || !brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Generate collection ID from title; suffix to avoid trivial collisions
    const baseId = slugify(titleTrimmed) || "collection";
    const id =
      baseId.length > 100
        ? `${baseId.slice(0, 90)}-${randomUUID().slice(0, 8)}`
        : baseId;

    if (!COLLECTION_ID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid generated collection ID" }, { status: 400 });
    }

    const { data: existingCollection, error: checkError } = await authz.adminClient
      .from("catalogues")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing collection:", checkError.code);
      return NextResponse.json(
        { error: "Failed to check existing collections" },
        { status: 500 }
      );
    }

    if (existingCollection) {
      console.error("Collection already exists with ID:", id);
      return NextResponse.json(
        { error: "A collection with this title already exists" },
        { status: 409 }
      );
    }

    // Create the collection
    const collectionData = {
      id,
      title: titleTrimmed,
      description: typeof description === "string" ? description.trim() || null : null,
      brand_id,
      image: imageTrimmed,
    };

    const { data: collection, error } = await authz.adminClient
      .from("catalogues")
      .insert([collectionData])
      .select(COLLECTION_SELECT_FIELDS)
      .single();

    if (error) {
      console.error("Error creating collection:", error.code);
      return NextResponse.json(
        { error: "Failed to create collection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in collections POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
