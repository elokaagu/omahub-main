import { supabase, Product } from "../supabase";

/**
 * Fetch all products
 */
export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*");

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch products by brand ID
 */
export async function getProductsByBrand(brandId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brandId);

  if (error) {
    console.error(`Error fetching products for brand ${brandId}:`, error);
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
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("collection_id", collectionId);

  if (error) {
    console.error(
      `Error fetching products for collection ${collectionId}:`,
      error
    );
    throw error;
  }

  return data || [];
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string): Promise<Product | null> {
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
 * Create a new product
 */
export async function createProduct(
  product: Omit<Product, "id">
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
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
  updates: Partial<Omit<Product, "id">>
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
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
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}

/**
 * Search products by title or description
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

  if (error) {
    console.error(`Error searching products with query ${query}:`, error);
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
