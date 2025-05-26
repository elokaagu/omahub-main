"use client";

import { useEffect, useState } from "react";
import { getAllBrands } from "@/lib/services/brandService";
import Link from "next/link";
import { Brand } from "@/lib/supabase";

export default function DebugPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getAllBrands();
        console.log("Fetched brands:", data);
        setBrands(data);
      } catch (error) {
        console.error("Error fetching brands:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug: Brand Links</h1>

      {loading ? (
        <p>Loading brands...</p>
      ) : (
        <div>
          <p className="mb-4">Total brands: {brands.length}</p>

          <ul className="space-y-2">
            {brands.map((brand) => (
              <li key={brand.id} className="p-2 border rounded">
                <div className="font-bold">{brand.name}</div>
                <div className="text-sm text-gray-500">ID: {brand.id}</div>
                <div className="mt-2">
                  <Link
                    href={`/studio/brands/${encodeURIComponent(
                      brand.id.trim().toLowerCase()
                    )}`}
                    className="text-blue-500 hover:underline"
                    onClick={() => console.log(`Clicking brand: ${brand.id}`)}
                  >
                    Edit Brand
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
