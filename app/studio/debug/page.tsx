"use client";

import { useEffect, useState } from "react";
import { getAllBrands } from "@/lib/services/brandService";
import { Brand } from "@/lib/supabase";

export default function DebugPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrands() {
      setLoading(true);
      try {
        const data = await getAllBrands();
        console.log("Fetched brands:", data);
        setBrands(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching brands:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Debug Page - All Brands</h1>

      {loading ? (
        <div>Loading brands...</div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <div>
          <div className="mb-4">
            <strong>Total Brands: {brands.length}</strong>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <div key={brand.id} className="border rounded-lg p-4 shadow-sm">
                <div className="aspect-square w-full mb-2 bg-gray-100 rounded-md overflow-hidden">
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`Image failed to load: ${brand.image}`);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <h2 className="font-bold text-lg">{brand.name}</h2>
                <p className="text-sm text-gray-600 mb-2">{brand.category}</p>
                <p className="text-sm text-gray-600 mb-2">{brand.location}</p>
                <p className="text-xs text-gray-500">ID: {brand.id}</p>
                <div className="mt-4 pt-4 border-t">
                  <details>
                    <summary className="cursor-pointer text-sm text-blue-500">
                      View Raw Data
                    </summary>
                    <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(brand, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
