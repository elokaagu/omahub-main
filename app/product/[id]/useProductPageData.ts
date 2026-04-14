"use client";

import { useState, useEffect } from "react";
import { getProductById } from "@/lib/services/productService";
import { getBrandById } from "@/lib/services/brandService";
import type { Product, Brand } from "@/lib/supabase";

export function useProductPageData(
  productId: string,
  initialProduct: Product,
  initialBrand: Brand
) {
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [brand, setBrand] = useState<Brand | null>(initialBrand);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const matchesInitial =
      productId === initialProduct.id &&
      initialBrand.id === initialProduct.brand_id;

    if (matchesInitial) {
      setProduct(initialProduct);
      setBrand(initialBrand);
      setError(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const productData = await getProductById(productId);
        if (cancelled) return;
        if (!productData) {
          setError("Product not found");
          setProduct(null);
          setBrand(null);
          return;
        }
        const brandData = await getBrandById(productData.brand_id);
        if (cancelled) return;
        if (!brandData) {
          setError("Brand information not found");
          setProduct(null);
          setBrand(null);
          return;
        }
        setProduct(productData);
        setBrand(brandData);
      } catch {
        if (!cancelled) {
          setError("Failed to load product information");
          setProduct(null);
          setBrand(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId, initialProduct, initialBrand]);

  return { product, brand, loading, error };
}
