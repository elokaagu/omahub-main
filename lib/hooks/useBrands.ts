"use client";

import { useState, useEffect } from "react";
import {
  getAllBrands,
  getBrandById,
  getBrandsByCategory,
  getBrandReviews,
  getBrandCollections,
  searchBrands,
} from "../services/brandService";
import { Brand, Review, Collection } from "../supabase";

export function useAllBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const data = await getAllBrands();
        setBrands(data);
      } catch (err) {
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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const data = await getBrandCollections(brandId);
        setCollections(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (brandId) {
      fetchCollections();
    }
  }, [brandId]);

  return { collections, loading, error };
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
