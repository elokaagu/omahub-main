"use client";

import { useState, useEffect } from "react";
import {
  getAllBrands,
  getBrandById,
  getBrandsByCategory,
  getBrandReviews,
  getBrandCollections,
  searchBrands,
  forceRefreshBrands,
} from "../services/brandService";
import { Brand, Review, Catalogue } from "../supabase";

export function useAllBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBrands() {
      try {
        console.log("🔄 useAllBrands: Force refreshing brands...");
        const data = await forceRefreshBrands();
        console.log("✅ useAllBrands: Got", data.length, "brands");
        setBrands(data);
      } catch (err) {
        console.error("❌ useAllBrands: Error fetching brands:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  return { brands, loading, error };
}

export function useBrandById(id: string) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBrand() {
      try {
        const data = await getBrandById(id);
        setBrand(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchBrand();
    }
  }, [id]);

  return { brand, loading, error };
}

export function useBrandsByCategory(category: string) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const data = await getBrandsByCategory(category);
        setBrands(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (category) {
      fetchBrands();
    }
  }, [category]);

  return { brands, loading, error };
}

export function useBrandReviews(brandId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const data = await getBrandReviews(brandId);
        setReviews(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (brandId) {
      fetchReviews();
    }
  }, [brandId]);

  return { reviews, loading, error };
}

export function useBrandCollections(brandId: string) {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCatalogues() {
      try {
        const data = await getBrandCollections(brandId);
        setCatalogues(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (brandId) {
      fetchCatalogues();
    }
  }, [brandId]);

  return { catalogues, loading, error };
}

export function useSearchBrands(query: string) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function performSearch() {
      if (!query || query.trim() === "") {
        setBrands([]);
        return;
      }

      setLoading(true);

      try {
        const data = await searchBrands(query);
        setBrands(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return { brands, loading, error };
}
