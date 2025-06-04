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

  try {
    // Prepare the data with only core required fields first
    const coreData = {
      title: productData.title,
      description: productData.description,
      price: productData.price,
      sale_price: productData.sale_price || null,
      image: productData.image,
      brand_id: productData.brand_id,
      collection_id: productData.collection_id || null,
      category: productData.category,
      in_stock: productData.in_stock ?? true,
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try to add optional fields if they exist in the schema
    const optionalFields = [
      "materials",
      "care_instructions",
      "is_custom",
      "lead_time",
      "images",
    ];
    const finalData = { ...coreData };

    // Only add optional fields if they have values
    optionalFields.forEach((field) => {
      if (productData[field] !== undefined && productData[field] !== null) {
        finalData[field] = productData[field];
      }
    });

    console.log("Attempting to create product with data:", finalData);

    const { data, error } = await supabase
      .from("products")
      .insert(finalData)
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);

      // If it's a schema error, try with just core fields
      if (
        error.message?.includes("schema cache") ||
        error.message?.includes("column")
      ) {
        console.log("Schema error detected, retrying with core fields only...");

        const { data: retryData, error: retryError } = await supabase
          .from("products")
          .insert(coreData)
          .select()
          .single();

        if (retryError) {
          console.error("Retry with core fields also failed:", retryError);
          throw retryError;
        }

        console.log("Successfully created product with core fields only");
        return retryData;
      }

      throw error;
    }

    return data;
  } catch (error) {
    console.error("Exception in createProduct:", error);
    throw error;
  }
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

/**
 * Get related products from the same brand or collection, excluding the current product
 */
export async function getRelatedProducts(
  currentProductId: string,
  brandId?: string,
  collectionId?: string,
  limit: number = 4
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  let query = supabase
    .from("products")
    .select("*")
    .neq("id", currentProductId) // Exclude current product
    .limit(limit);

  // Prioritize products from the same collection, then same brand
  if (collectionId) {
    query = query.eq("collection_id", collectionId);
  } else if (brandId) {
    query = query.eq("brand_id", brandId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching related products:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get products from the same collection for collection page recommendations
 */
export async function getCollectionRecommendations(
  collectionId: string,
  excludeProductId?: string,
  limit: number = 4
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  let query = supabase
    .from("products")
    .select("*")
    .eq("collection_id", collectionId)
    .limit(limit);

  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching collection recommendations:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get intelligent recommendations based on user favorites and collection context
 * Prioritizes products from user's favorite brands, then falls back to collection products
 */
export async function getIntelligentRecommendations(
  collectionId: string,
  userId?: string,
  excludeProductId?: string,
  limit: number = 4
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  let recommendations: Product[] = [];

  // If user is logged in, get products from their favorite brands first
  if (userId) {
    try {
      // Get user's favorite brands
      const { data: favorites, error: favError } = await supabase
        .from("favorites")
        .select("brand_id")
        .eq("user_id", userId);

      if (!favError && favorites && favorites.length > 0) {
        const favoriteBrandIds = favorites.map((f) => f.brand_id);

        // Get products from favorite brands (excluding current product)
        let favoriteQuery = supabase
          .from("products")
          .select("*")
          .in("brand_id", favoriteBrandIds)
          .eq("in_stock", true)
          .limit(limit * 2); // Get more to have variety

        if (excludeProductId) {
          favoriteQuery = favoriteQuery.neq("id", excludeProductId);
        }

        const { data: favoriteProducts, error: favProdError } =
          await favoriteQuery.order("created_at", { ascending: false });

        if (!favProdError && favoriteProducts) {
          // Shuffle and take up to half the limit from favorite brands
          const shuffled = favoriteProducts.sort(() => Math.random() - 0.5);
          recommendations = shuffled.slice(0, Math.ceil(limit / 2));
        }
      }
    } catch (error) {
      console.error("Error fetching favorite brand products:", error);
      // Continue with fallback logic
    }
  }

  // Fill remaining slots with products from the same collection
  const remainingSlots = limit - recommendations.length;
  if (remainingSlots > 0) {
    try {
      let collectionQuery = supabase
        .from("products")
        .select("*")
        .eq("collection_id", collectionId)
        .eq("in_stock", true)
        .limit(remainingSlots * 2); // Get more for variety

      if (excludeProductId) {
        collectionQuery = collectionQuery.neq("id", excludeProductId);
      }

      // Exclude products already in recommendations
      if (recommendations.length > 0) {
        const existingIds = recommendations.map((p) => p.id);
        collectionQuery = collectionQuery.not(
          "id",
          "in",
          `(${existingIds.join(",")})`
        );
      }

      const { data: collectionProducts, error: collError } =
        await collectionQuery.order("created_at", { ascending: false });

      if (!collError && collectionProducts) {
        // Shuffle and add to recommendations
        const shuffled = collectionProducts.sort(() => Math.random() - 0.5);
        recommendations = [
          ...recommendations,
          ...shuffled.slice(0, remainingSlots),
        ];
      }
    } catch (error) {
      console.error("Error fetching collection products:", error);
    }
  }

  // If still not enough, get products from the same brand as the collection
  if (recommendations.length < limit) {
    try {
      // First get the collection to find its brand
      const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select("brand_id")
        .eq("id", collectionId)
        .single();

      if (!collectionError && collection) {
        const remainingSlots = limit - recommendations.length;

        let brandQuery = supabase
          .from("products")
          .select("*")
          .eq("brand_id", collection.brand_id)
          .eq("in_stock", true)
          .limit(remainingSlots * 2);

        if (excludeProductId) {
          brandQuery = brandQuery.neq("id", excludeProductId);
        }

        // Exclude products already in recommendations
        if (recommendations.length > 0) {
          const existingIds = recommendations.map((p) => p.id);
          brandQuery = brandQuery.not("id", "in", `(${existingIds.join(",")})`);
        }

        const { data: brandProducts, error: brandError } =
          await brandQuery.order("created_at", { ascending: false });

        if (!brandError && brandProducts) {
          const shuffled = brandProducts.sort(() => Math.random() - 0.5);
          recommendations = [
            ...recommendations,
            ...shuffled.slice(0, remainingSlots),
          ];
        }
      }
    } catch (error) {
      console.error("Error fetching brand products:", error);
    }
  }

  return recommendations.slice(0, limit);
}
