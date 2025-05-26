import { supabase } from "../supabase";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  sale_price?: number;
  image: string;
  brand_id: string;
  collection_id?: string;
  category: string;
  in_stock: boolean;
  sizes?: string[];
  colors?: string[];
  created_at: string;
}

/**
 * Fetch all products from the database
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
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
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
  productData: Omit<Product, "id" | "created_at">
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .insert([productData])
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
  productData: Partial<Omit<Product, "id" | "created_at">>
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .update(productData)
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
 * Fetch products for a specific brand
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
 * Fetch products for a specific collection
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
 * Fetch products by category
 */
export async function getProductsByCategory(
  category: string
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category);

  if (error) {
    console.error(`Error fetching products in category ${category}:`, error);
    throw error;
  }

  return data || [];
}

/**
 * Search products
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
