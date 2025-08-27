import { supabase, Product } from "../supabase";
import { normalizeProductImages } from "../utils/productImageUtils";
import { getBrandCurrency } from "../utils/currencyUtils";

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

  // Normalize product images to ensure first image is always the main image
  return normalizeProductImages(data || []);
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
 * Fetch products by brand ID (excludes portfolio items for public display)
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

  // Normalize product images to ensure first image is always the main image
  return normalizeProductImages(data || []);
}

/**
 * Fetch ALL products by brand ID (including portfolio items for admin use)
 */
export async function getAllProductsByBrand(
  brandId: string
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all products by brand:", error);
    throw error;
  }

  // Normalize product images to ensure first image is always the main image
  return normalizeProductImages(data || []);
}

/**
 * Fetch products by catalogue ID (excludes portfolio items for public display)
 */
export async function getProductsByCatalogue(
  catalogueId: string
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("catalogue_id", catalogueId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products by catalogue:", error);
    throw error;
  }

  // Normalize product images to ensure first image is always the main image
  return normalizeProductImages(data || []);
}

/**
 * Fetch products with brand and catalogue information
 */
export async function getProductsWithDetails(): Promise<
  (Product & {
    brand: { name: string; id: string; location: string; is_verified: boolean };
    catalogue?: { title: string; id: string };
  })[]
> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    // First, get products with brands (this works)
    const { data: productsWithBrands, error: productsError } =
      await supabase.from("products").select(`
        *,
        brand:brands(id, name, location, is_verified)
      `);

    if (productsError) {
      console.error("Error fetching products with brands:", productsError);
      throw productsError;
    }

    if (!productsWithBrands || productsWithBrands.length === 0) {
      return [];
    }

    // Get all catalogues to manually join
    const { data: catalogues, error: cataloguesError } = await supabase
      .from("catalogues")
      .select("id, title");

    if (cataloguesError) {
      console.error("Error fetching catalogues:", cataloguesError);
      // Continue without catalogues data
    }

    // Manually join catalogues data
    const productsWithDetails = productsWithBrands.map((product: any) => {
      const catalogue = catalogues?.find(
        (c: any) => c.id === product.catalogue_id
      );
      return {
        ...product,
        catalogue: catalogue
          ? { id: catalogue.id, title: catalogue.title }
          : undefined,
      };
    });

    // Normalize product images to ensure first image is always the main image
    return normalizeProductImages(productsWithDetails);
  } catch (error) {
    console.error("Error in getProductsWithDetails:", error);
    throw error;
  }
}

/**
 * Fetch products with complete brand information including currency data
 */
export async function getProductsWithBrandCurrency(): Promise<
  (Product & {
    brand: {
      name: string;
      id: string;
      location: string;
      is_verified: boolean;
      price_range?: string;
    };
    catalogue?: { title: string; id: string };
  })[]
> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    // Get products with complete brand information including price_range (excludes portfolio items)
    const { data: productsWithBrands, error: productsError } =
      await supabase.from("products").select(`
        *,
        brand:brands(id, name, location, is_verified, price_range)
      `);

    if (productsError) {
      console.error("Error fetching products with brands:", productsError);
      throw productsError;
    }

    if (!productsWithBrands || productsWithBrands.length === 0) {
      return [];
    }

    // Get all catalogues to manually join
    const { data: catalogues, error: cataloguesError } = await supabase
      .from("catalogues")
      .select("id, title");

    if (cataloguesError) {
      console.error("Error fetching catalogues:", cataloguesError);
      // Continue without catalogues data
    }

    // Manually join catalogues data
    const productsWithDetails = productsWithBrands.map((product: any) => {
      const catalogue = catalogues?.find(
        (c: any) => c.id === product.catalogue_id
      );
      return {
        ...product,
        catalogue: catalogue
          ? { id: catalogue.id, title: catalogue.title }
          : undefined,
      };
    });

    // Normalize product images to ensure first image is always the main image
    return normalizeProductImages(productsWithDetails);
  } catch (error) {
    console.error("Error in getProductsWithBrandCurrency:", error);
    throw error;
  }
}

/**
 * Fetch ALL products with complete brand information including price_range (includes portfolio items for admin use)
 */
export async function getAllProductsWithBrandCurrency(): Promise<
  (Product & {
    brand: {
      name: string;
      id: string;
      location: string;
      is_verified: boolean;
      price_range?: string;
    };
    catalogue?: { title: string; id: string };
  })[]
> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    // Get ALL products with complete brand information including price_range (includes portfolio items)
    const { data: productsWithBrands, error: productsError } =
      await supabase.from("products").select(`
        *,
        brand:brands(id, name, location, is_verified, price_range)
      `);

    if (productsError) {
      console.error("Error fetching all products with brands:", productsError);
      throw productsError;
    }

    if (!productsWithBrands || productsWithBrands.length === 0) {
      return [];
    }

    // Get all catalogues to manually join
    const { data: catalogues, error: cataloguesError } = await supabase
      .from("catalogues")
      .select("id, title");

    if (cataloguesError) {
      console.error("Error fetching catalogues:", cataloguesError);
      // Continue without catalogues data
    }

    // Manually join catalogues data
    const productsWithDetails = productsWithBrands.map((product: any) => {
      const catalogue = catalogues?.find(
        (c: any) => c.id === product.catalogue_id
      );
      return {
        ...product,
        catalogue: catalogue
          ? { id: catalogue.id, title: catalogue.title }
          : undefined,
      };
    });

    // Normalize product images to ensure first image is always the main image
    return normalizeProductImages(productsWithDetails);
  } catch (error) {
    console.error("Error in getAllProductsWithBrandCurrency:", error);
    throw error;
  }
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
    // 🔒 ENFORCE CURRENCY VALIDATION - Backend Check
    if (productData.brand_id && productData.currency) {
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("currency, price_range, location")
        .eq("id", productData.brand_id)
        .single();

      if (brandError) {
        console.error("Error fetching brand for currency validation:", brandError);
        throw new Error("Failed to validate brand currency");
      }

      if (brand) {
        const brandCurrency = getBrandCurrency(brand);
        if (brandCurrency && productData.currency !== brandCurrency.code) {
          throw new Error(
            `Currency mismatch! Product currency (${productData.currency}) does not match brand currency (${brandCurrency.code}). ` +
            `Products must use the same currency as their brand.`
          );
        }
      }
    }
    // Prepare the data with only core required fields first
    const coreData = {
      title: productData.title,
      description: productData.description,
      price: productData.price,
      sale_price: productData.sale_price || null,
      image: productData.image,
      brand_id: productData.brand_id,
      catalogue_id: productData.catalogue_id || null,
      category: productData.category,
      categories: productData.categories || [],
      in_stock: productData.in_stock ?? true,
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      currency: productData.currency || "USD", // Add currency field
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
      "video_url",
      "video_thumbnail",
      "video_type",
      "video_description",
      "service_type",
      "techniques",
      "inspiration",
      "contact_for_pricing",
      "specialties",
      "consultation_fee",
      "price_range",
      "hourly_rate",
      "fixed_price",
      "duration",
      "sessions_included",
      "requirements",
      "measurement_guide",
      "fitting_sessions",
      "delivery_method",
      "includes",
      "created_by",
    ];
    const finalData = { ...coreData };

    // Only add optional fields if they have values
    optionalFields.forEach((field) => {
      if (
        productData[field as keyof typeof productData] !== undefined &&
        productData[field as keyof typeof productData] !== null
      ) {
        (finalData as any)[field] =
          productData[field as keyof typeof productData];
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

  // 🔒 ENFORCE CURRENCY VALIDATION - Backend Check for Updates
  if (productData.brand_id && productData.currency) {
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("currency, price_range, location")
      .eq("id", productData.brand_id)
      .single();

    if (brandError) {
      console.error("Error fetching brand for currency validation:", brandError);
      throw new Error("Failed to validate brand currency");
    }

    if (brand) {
      const brandCurrency = getBrandCurrency(brand);
      if (brandCurrency && productData.currency !== brandCurrency.code) {
        throw new Error(
          `Currency mismatch! Product currency (${productData.currency}) does not match brand currency (${brandCurrency.code}). ` +
          `Products must use the same currency as their brand.`
        );
      }
    }
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

  // Normalize product images to ensure first image is always the main image
  return normalizeProductImages(data || []);
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
 * Get related products based on brand and catalogue
 */
export async function getRelatedProducts(
  currentProductId: string,
  brandId?: string,
  catalogueId?: string,
  limit: number = 4
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    let query = supabase
      .from("products")
      .select("*")
      .neq("id", currentProductId)
      .limit(limit);

    // Prioritize products from the same catalogue, then same brand
    if (catalogueId) {
      query = query.eq("catalogue_id", catalogueId);
    } else if (brandId) {
      query = query.eq("brand_id", brandId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching related products:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getRelatedProducts:", error);
    throw error;
  }
}

/**
 * Get catalogue recommendations (products from same catalogue)
 */
export async function getCatalogueRecommendations(
  catalogueId: string,
  excludeProductId?: string,
  limit: number = 4
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    let query = supabase
      .from("products")
      .select("*")
      .eq("catalogue_id", catalogueId)
      .limit(limit);

    if (excludeProductId) {
      query = query.neq("id", excludeProductId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching catalogue recommendations:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCatalogueRecommendations:", error);
    throw error;
  }
}

/**
 * Get intelligent recommendations based on user favourites and catalogue/brand
 */
export async function getIntelligentRecommendations(
  userId?: string,
  catalogueId?: string,
  brandId?: string,
  limit: number = 4
): Promise<Product[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    let recommendations: Product[] = [];

    // If user is logged in, get recommendations based on their favourite brands
    if (userId) {
      // Get user's favourite products to understand their preferred brands
      const { data: favourites } = await supabase
        .from("favourites")
        .select("product_id")
        .eq("user_id", userId);

      if (favourites && favourites.length > 0) {
        // Get the brands of favourited products
        const { data: favouritedProducts } = await supabase
          .from("products")
          .select("brand_id")
          .in(
            "id",
            favourites.map((f: any) => f.product_id)
          );

        if (favouritedProducts && favouritedProducts.length > 0) {
          const favouriteBrandIds = [
            ...new Set(favouritedProducts.map((p: any) => p.brand_id)),
          ];

          // Get products from favourite brands (up to half of the limit)
          const favouriteLimit = Math.ceil(limit / 2);
          const { data: favouriteBasedProducts } = await supabase
            .from("products")
            .select("*")
            .in("brand_id", favouriteBrandIds)
            .limit(favouriteLimit)
            .order("created_at", { ascending: false });

          if (favouriteBasedProducts) {
            recommendations.push(...favouriteBasedProducts);
          }
        }
      }
    }

    // Fill remaining slots with catalogue products
    const remainingLimit = limit - recommendations.length;
    if (remainingLimit > 0 && catalogueId) {
      const { data: catalogueProducts } = await supabase
        .from("products")
        .select("*")
        .eq("catalogue_id", catalogueId)
        .not("id", "in", `(${recommendations.map((r) => r.id).join(",")})`)
        .limit(remainingLimit)
        .order("created_at", { ascending: false });

      if (catalogueProducts) {
        recommendations.push(...catalogueProducts);
      }
    }

    // If still need more, get products from the same brand
    const stillNeedMore = limit - recommendations.length;
    if (stillNeedMore > 0 && brandId) {
      const { data: brandProducts } = await supabase
        .from("products")
        .select("*")
        .eq("brand_id", brandId)
        .not("id", "in", `(${recommendations.map((r) => r.id).join(",")})`)
        .limit(stillNeedMore)
        .order("created_at", { ascending: false });

      if (brandProducts) {
        recommendations.push(...brandProducts);
      }
    }

    // Shuffle the recommendations for variety
    return recommendations.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Error in getIntelligentRecommendations:", error);
    // Fallback to catalogue products if intelligent recommendations fail
    if (catalogueId) {
      return getCatalogueRecommendations(catalogueId, undefined, limit);
    }
    return [];
  }
}

/**
 * Get intelligent recommendations with brand information for proper currency display
 */
export async function getIntelligentRecommendationsWithBrand(
  userId?: string,
  catalogueId?: string,
  brandId?: string,
  limit: number = 4
): Promise<(Product & { brand: { price_range?: string; currency?: string; location?: string } })[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    let recommendations: (Product & { brand: { price_range?: string } })[] = [];

    // If user is logged in, get recommendations based on their favourite brands
    if (userId) {
      // Get user's favourite products to understand their preferred brands
      const { data: favourites } = await supabase
        .from("favourites")
        .select("product_id")
        .eq("user_id", userId);

      if (favourites && favourites.length > 0) {
        // Get the brands of favourited products
        const { data: favouritedProducts } = await supabase
          .from("products")
          .select("brand_id")
          .in(
            "id",
            favourites.map((f: any) => f.product_id)
          );

        if (favouritedProducts && favouritedProducts.length > 0) {
          const favouriteBrandIds = [
            ...new Set(favouritedProducts.map((p: any) => p.brand_id)),
          ];

          // Get products from favourite brands with brand info (up to half of the limit)
          const favouriteLimit = Math.ceil(limit / 2);
          const { data: favouriteBasedProducts } = await supabase
            .from("products")
            .select(
              `
              *,
              brand:brands(price_range, currency, location)
            `
            )
            .in("brand_id", favouriteBrandIds)
            .limit(favouriteLimit)
            .order("created_at", { ascending: false });

          if (favouriteBasedProducts) {
            recommendations.push(...favouriteBasedProducts);
          }
        }
      }
    }

    // Fill remaining slots with catalogue products
    const remainingLimit = limit - recommendations.length;
    if (remainingLimit > 0 && catalogueId) {
      const { data: catalogueProducts } = await supabase
        .from("products")
        .select(
          `
          *,
          brand:brands(price_range, currency, location)
        `
        )
        .eq("catalogue_id", catalogueId)
        .not("id", "in", `(${recommendations.map((r) => r.id).join(",")})`)
        .limit(remainingLimit)
        .order("created_at", { ascending: false });

      if (catalogueProducts) {
        recommendations.push(...catalogueProducts);
      }
    }

    // If still need more, get products from the same brand
    const stillNeedMore = limit - recommendations.length;
    if (stillNeedMore > 0 && brandId) {
      const { data: brandProducts } = await supabase
        .from("products")
        .select(
          `
          *,
          brand:brands(price_range, currency, location)
        `
        )
        .eq("brand_id", brandId)
        .not("id", "in", `(${recommendations.map((r) => r.id).join(",")})`)
        .limit(stillNeedMore)
        .order("created_at", { ascending: false });

      if (brandProducts) {
        recommendations.push(...brandProducts);
      }
    }

    // Shuffle the recommendations for variety
    return recommendations.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Error in getIntelligentRecommendationsWithBrand:", error);
    // Fallback to catalogue products with brand info if intelligent recommendations fail
    if (catalogueId) {
      return getCatalogueRecommendationsWithBrand(
        catalogueId,
        undefined,
        limit
      );
    }
    return [];
  }
}

/**
 * Get catalogue recommendations with brand information for proper currency display
 */
export async function getCatalogueRecommendationsWithBrand(
  catalogueId: string,
  excludeProductId?: string,
  limit: number = 4
): Promise<(Product & { brand: { price_range?: string; currency?: string; location?: string } })[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    let query = supabase
      .from("products")
      .select(
        `
        *,
        brand:brands(price_range, currency, location)
      `
      )
      .eq("catalogue_id", catalogueId)
      .limit(limit);

    if (excludeProductId) {
      query = query.neq("id", excludeProductId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error(
        "Error fetching catalogue recommendations with brand:",
        error
      );
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getCatalogueRecommendationsWithBrand:", error);
    throw error;
  }
}
