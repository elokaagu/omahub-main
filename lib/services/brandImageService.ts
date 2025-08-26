import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Brand, BrandImage } from "@/lib/supabase";

export interface BrandWithImages extends Omit<Brand, 'image'> {
  brand_images: BrandImage[];
}

export interface ImageUrlData {
  url: string;
  expiresAt: number;
  role: string;
}

export class BrandImageService {
  private supabase = createClientComponentClient();

  /**
   * Get a brand with all its associated images
   */
  async getBrandWithImages(brandId: string): Promise<BrandWithImages | null> {
    try {
      const { data, error } = await this.supabase
        .from("brands")
        .select(`
          *,
          brand_images (
            id,
            role,
            storage_path,
            created_at,
            updated_at
          )
        `)
        .eq("id", brandId)
        .single();

      if (error) {
        console.error("Error fetching brand with images:", error);
        return null;
      }

      return data as BrandWithImages;
    } catch (error) {
      console.error("Error in getBrandWithImages:", error);
      return null;
    }
  }

  /**
   * Get all brands with their associated images
   */
  async getAllBrandsWithImages(): Promise<BrandWithImages[]> {
    try {
      const { data, error } = await this.supabase
        .from("brands")
        .select(`
          *,
          brand_images (
            id,
            role,
            storage_path,
            created_at,
            updated_at
          )
        `)
        .order("name");

      if (error) {
        console.error("Error fetching brands with images:", error);
        return [];
      }

      return data as BrandWithImages[];
    } catch (error) {
      console.error("Error in getAllBrandsWithImages:", error);
      return [];
    }
  }

  /**
   * Get a signed URL for a brand image
   * This provides cache-busting and security
   */
  async getBrandImageUrl(
    storagePath: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from("brand-assets") // or "omahub" depending on your bucket
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        console.error("Error creating signed URL:", error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error("Error in getBrandImageUrl:", error);
      return null;
    }
  }

  /**
   * Get the cover image URL for a brand
   */
  async getBrandCoverUrl(brand: BrandWithImages): Promise<string | null> {
    const coverImage = brand.brand_images?.find(img => img.role === 'cover');
    
    if (!coverImage) {
      return null;
    }

    return this.getBrandImageUrl(coverImage.storage_path);
  }

  /**
   * Get all image URLs for a brand
   */
  async getBrandImageUrls(brand: BrandWithImages): Promise<ImageUrlData[]> {
    const imageUrls: ImageUrlData[] = [];

    for (const image of brand.brand_images || []) {
      const url = await this.getBrandImageUrl(image.storage_path);
      if (url) {
        imageUrls.push({
          url,
          expiresAt: Date.now() + (3600 * 1000), // 1 hour from now
          role: image.role
        });
      }
    }

    return imageUrls;
  }

  /**
   * Add a new image to a brand
   */
  async addBrandImage(
    brandId: string,
    role: string,
    storagePath: string
  ): Promise<BrandImage | null> {
    try {
      const { data, error } = await this.supabase
        .from("brand_images")
        .insert({
          brand_id: brandId,
          role,
          storage_path: storagePath
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding brand image:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in addBrandImage:", error);
      return null;
    }
  }

  /**
   * Update a brand image
   */
  async updateBrandImage(
    imageId: string,
    updates: Partial<Pick<BrandImage, 'role' | 'storage_path'>>
  ): Promise<BrandImage | null> {
    try {
      const { data, error } = await this.supabase
        .from("brand_images")
        .update(updates)
        .eq("id", imageId)
        .select()
        .single();

      if (error) {
        console.error("Error updating brand image:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in updateBrandImage:", error);
      return null;
    }
  }

  /**
   * Delete a brand image
   */
  async deleteBrandImage(imageId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("brand_images")
        .delete()
        .eq("id", imageId);

      if (error) {
        console.error("Error deleting brand image:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteBrandImage:", error);
      return false;
    }
  }

  /**
   * Upload a new brand image and add it to the database
   */
  async uploadBrandImage(
    brandId: string,
    file: File,
    role: string = 'cover'
  ): Promise<BrandImage | null> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${brandId}_${role}_${Date.now()}.${fileExt}`;
      const storagePath = `${brandId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await this.supabase.storage
        .from("brand-assets") // or "omahub"
        .upload(storagePath, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        return null;
      }

      // Add to database
      return this.addBrandImage(brandId, role, storagePath);
    } catch (error) {
      console.error("Error in uploadBrandImage:", error);
      return null;
    }
  }

  /**
   * Get a fallback image URL for brands without images
   */
  getFallbackImageUrl(): string {
    // Return a default placeholder image
    return "/images/brand-placeholder.jpg";
  }

  /**
   * Check if a brand has a specific type of image
   */
  hasImageRole(brand: BrandWithImages, role: string): boolean {
    return brand.brand_images?.some(img => img.role === role) || false;
  }

  /**
   * Get the primary image for display (cover, or first available)
   */
  getPrimaryImage(brand: BrandWithImages): BrandImage | null {
    return brand.brand_images?.find(img => img.role === 'cover') || 
           brand.brand_images?.[0] || 
           null;
  }
}

// Export singleton instance
export const brandImageService = new BrandImageService();
