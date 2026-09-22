import { Package } from "lucide-react";
import { permissionsForProfileRole } from "@/lib/services/permissionsService";
import { getStudioSession } from "@/lib/studio/session";
import { brandAssetsPublicUrl } from "@/lib/brands/applicationBrandImages";
import { StudioLoadError } from "@/components/studio/StudioLoadError";
import { BrandsTable, type StudioBrandRow } from "./BrandsTable";

export const dynamic = "force-dynamic";

const LIST_COLUMNS =
  "id, name, description, category, location, rating, is_verified, brand_images(storage_path)";

type BrandListQueryRow = Omit<StudioBrandRow, "imageUrl"> & {
  brand_images: { storage_path: string | null }[] | null;
};

function toRow(brand: BrandListQueryRow): StudioBrandRow {
  const storagePath = brand.brand_images?.[0]?.storage_path;
  const { brand_images: _images, ...rest } = brand;
  return {
    ...rest,
    imageUrl: storagePath ? brandAssetsPublicUrl(storagePath) : "",
  };
}

/**
 * Studio brands list, rendered on the server. Admins see every brand;
 * brand admins see the brands assigned to them.
 */
export default async function BrandsPage() {
  const { supabase, profile } = await getStudioSession();
  const role = profile?.role ?? "user";

  if (!permissionsForProfileRole(role).includes("studio.brands.manage")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
          <p className="mt-2 text-gray-500">
            You don&apos;t have permission to manage brands.
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = role === "admin" || role === "super_admin";
  const isBrandOwner = role === "brand_admin";
  const ownedBrandIds = profile?.owned_brands ?? [];

  let brands: StudioBrandRow[] = [];
  if (isAdmin || (isBrandOwner && ownedBrandIds.length > 0)) {
    let query = supabase.from("brands").select(LIST_COLUMNS).order("name");
    if (!isAdmin) query = query.in("id", ownedBrandIds);

    const { data, error } = await query;
    if (error) {
      console.error("[studio/brands]", error.message);
      return (
        <StudioLoadError message="We couldn’t load brands. Check your connection and try again." />
      );
    }
    brands = ((data ?? []) as unknown as BrandListQueryRow[]).map(toRow);
  }

  return (
    <BrandsTable
      brands={brands}
      isBrandOwner={isBrandOwner}
      canCreate={isAdmin}
    />
  );
}
