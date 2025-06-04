"use client";

import { useBrandOwnerAccess } from "@/lib/hooks/useBrandOwnerAccess";
import { getAllBrands } from "@/lib/services/brandService";
import { useState, useEffect } from "react";
import { Brand } from "@/lib/supabase";

export default function BrandManagementDebug() {
  const accessData = useBrandOwnerAccess();
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const brands = await getAllBrands();
        setAllBrands(brands);
        const filtered = accessData.filterBrandsByOwnership(brands);
        setFilteredBrands(filtered);
      } catch (error) {
        console.error("Error fetching brands for debug:", error);
      }
    }

    if (!accessData.loading && accessData.user && accessData.canManageBrands) {
      fetchBrands();
    }
  }, [accessData.loading, accessData.user, accessData.canManageBrands]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">
        🐛 Brand Management Debug Info
      </h3>

      <div className="space-y-3 text-sm">
        <div>
          <strong>User Info:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(
              {
                id: accessData.user?.id,
                email: accessData.user?.email,
                role: accessData.user?.role,
                owned_brands: accessData.user?.owned_brands,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div>
          <strong>User Profile:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(
              {
                id: accessData.userProfile?.id,
                email: accessData.userProfile?.email,
                role: accessData.userProfile?.role,
                owned_brands: accessData.userProfile?.owned_brands,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div>
          <strong>Access Control:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(
              {
                isBrandOwner: accessData.isBrandOwner,
                isAdmin: accessData.isAdmin,
                ownedBrandIds: accessData.ownedBrandIds,
                canManageBrands: accessData.canManageBrands,
                loading: accessData.loading,
                error: accessData.error,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div>
          <strong>Permissions:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(accessData.userPermissions, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Brands Data:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(
              {
                totalBrands: allBrands.length,
                filteredBrands: filteredBrands.length,
                brandsList: filteredBrands.map((b) => ({
                  id: b.id,
                  name: b.name,
                })),
                ehbsCoutureExists: allBrands.some(
                  (b) => b.id === "ehbs-couture"
                ),
                ehbsCoutureInFiltered: filteredBrands.some(
                  (b) => b.id === "ehbs-couture"
                ),
              },
              null,
              2
            )}
          </pre>
        </div>

        {accessData.ownedBrandIds.length > 0 && (
          <div>
            <strong>Owned Brand Check:</strong>
            <pre className="bg-white p-2 rounded mt-1 text-xs overflow-auto">
              {JSON.stringify(
                {
                  ownedBrandIds: accessData.ownedBrandIds,
                  matchingBrands: allBrands
                    .filter((b) => accessData.ownedBrandIds.includes(b.id))
                    .map((b) => ({ id: b.id, name: b.name })),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
