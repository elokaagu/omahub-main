import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';

type ApplicationRow = {
  id: string;
  brand_name: string | null;
  designer_name: string | null;
  email: string | null;
  status: string | null;
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
        { status: 500 }
      );
    }
    const { data: applications, error } = await supabase
      .from("designer_applications")
      .select(
        "id, brand_name, designer_name, email, status, created_at, updated_at"
      )
      .order("created_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("❌ Error fetching applications:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    const appRows: ApplicationRow[] = (applications ?? []) as ApplicationRow[];

    const uniqueBrandNames = [...new Set(appRows.map((app) => app.brand_name).filter(Boolean))] as string[];
    const uniqueEmails = [...new Set(appRows.map((app) => app.email).filter(Boolean))] as string[];

    let brandMap = new Map<string, { id: string; is_verified: boolean }>();
    if (uniqueBrandNames.length > 0 && uniqueEmails.length > 0) {
      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("id, name, contact_email, is_verified")
        .in("name", uniqueBrandNames)
        .in("contact_email", uniqueEmails);

      if (brandsError) {
        console.error("❌ Error fetching brands for application correlation:", brandsError);
        return NextResponse.json(
          { error: "Failed to fetch brand mappings" },
          { status: 500 }
        );
      }

      brandMap = new Map(
        ((brands ?? []) as BrandRow[]).map((brand) => [
          makeBrandKey(brand.name, brand.contact_email),
          {
            id: brand.id,
            is_verified: !!brand.is_verified,
          },
        ])
      );
    }

    const enrichedApplications = appRows.map((app) => {
      const brand = brandMap.get(makeBrandKey(app.brand_name, app.email));
      return {
        ...app,
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
      { status: 500 }
    );
  }
}
