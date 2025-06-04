import { supabase, Product } from "../supabase";

/**
 * Fetch all products from the database
 */
export async function getAllProducts(): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (!supabase) {
    console.error("Supabase client not available");
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }

  return data;
}

/**
 * Fetch products by brand ID
 */
export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products by brand:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch products by collection ID
 */
export async function getProductsByCollection(
  collectionId: string
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products by collection:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch products with brand and collection information
 */
export async function getProductsWithDetails(): Promise<
  (Product & {
    brand: { name: string; id: string; location: string; is_verified: boolean };
    collection?: { title: string; id: string };
  })[]
> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase.from("products").select(`
      *,
      brand:brands(id, name, location, is_verified),
      collection:collections(id, title)
    `);

  if (error) {
    console.error("Error fetching products with details:", error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new product
 */
export async function createProduct(
  productData: Omit<Product, "id" | "created_at" | "updated_at">
): Promise<Product | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...productData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    throw error;
  }

  return data;
}

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  productData: Partial<Product>
): Promise<Product | null> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      ...productData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }

  return data;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}

/**
 * Search products by title, description, or category
 */
export async function searchProducts(query: string): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(
      `title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error searching products:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get featured products (can be customized based on your business logic)
 */
export async function getFeaturedProducts(
  limit: number = 8
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("in_stock", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching featured products:", error);
    throw error;
  }

  return data || [];
}
