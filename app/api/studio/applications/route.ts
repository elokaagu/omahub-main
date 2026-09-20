import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic";

const CORE_COLUMNS =
  "id, brand_name, designer_name, email, phone, website, instagram, location, category, description, year_founded, status, notes, created_at, updated_at";
const OPTIONAL_COLUMNS = "price_range, currency, image_urls";

type ApplicationRow = {
  id: string;
  brand_name: string | null;
  designer_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  location: string | null;
  category: string | null;
  description: string | null;
  year_founded: number | null;
  price_range?: string | null;
  currency?: string | null;
  image_urls?: string[] | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type BrandRow = {
  id: string;
  name: string | null;
  contact_email: string | null;
  is_verified: boolean | null;
};

function makeBrandKey(brandName: string | null, email: string | null): string {
  return `${(brandName ?? "").trim().toLowerCase()}::${(email ?? "").trim().toLowerCase()}`;
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  const message = (error?.message ?? "").toLowerCase();
  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

export async function GET(_request: NextRequest) {
  try {
    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const supabase = await getAdminClient();

    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    let { data: applications, error } = await supabase
      .from("designer_applications")
      .select(`${CORE_COLUMNS}, ${OPTIONAL_COLUMNS}`)
      .order("created_at", { ascending: false });

    if (error && isMissingColumnError(error)) {
      console.warn(
        "⚠️ designer_applications is missing optional columns; retrying with core fields only:",
        error.message,
      );
      const retry = await supabase
        .from("designer_applications")
        .select(CORE_COLUMNS)
        .order("created_at", { ascending: false });
      applications = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("❌ Error fetching applications:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 },
      );
    }

    const appRows: ApplicationRow[] = (applications ?? []) as ApplicationRow[];

    const uniqueBrandNames = [
      ...new Set(appRows.map((app) => app.brand_name).filter(Boolean)),
    ] as string[];
    const uniqueEmails = [
      ...new Set(appRows.map((app) => app.email).filter(Boolean)),
    ] as string[];

    let brandMap = new Map<string, { id: string; is_verified: boolean }>();
    if (uniqueBrandNames.length > 0 && uniqueEmails.length > 0) {
      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("id, name, contact_email, is_verified")
        .in("name", uniqueBrandNames)
        .in("contact_email", uniqueEmails);

      if (brandsError) {
        console.error(
          "❌ Error fetching brands for application correlation:",
          brandsError,
        );
      } else {
        brandMap = new Map(
          ((brands ?? []) as BrandRow[]).map((brand) => [
            makeBrandKey(brand.name, brand.contact_email),
            {
              id: brand.id,
              is_verified: !!brand.is_verified,
            },
          ]),
        );
      }
    }

    const enrichedApplications = appRows.map((app) => {
      const brand = brandMap.get(makeBrandKey(app.brand_name, app.email));
      return {
        ...app,
        brand_name: app.brand_name ?? "",
        designer_name: app.designer_name ?? "",
        email: app.email ?? "",
        location: app.location ?? "",
        category: app.category ?? "",
        description: app.description ?? "",
        status: app.status ?? "new",
        created_at: app.created_at ?? new Date().toISOString(),
        updated_at: app.updated_at ?? app.created_at ?? new Date().toISOString(),
        price_range: app.price_range ?? null,
        currency: app.currency ?? null,
        image_urls: app.image_urls ?? [],
        brand_id: brand?.id ?? null,
        brand_verified: brand?.is_verified ?? false,
      };
    });

    return NextResponse.json({
      applications: enrichedApplications,
      count: enrichedApplications.length,
    });
  } catch (error) {
    console.error("💥 Error in applications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
