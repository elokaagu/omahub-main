/**
 * Image Naming Service for OmaHub
 * Provides consistent naming conventions for all uploaded images
 * Ensures clear identification of image ownership and purpose
 */

export interface ImageNamingConfig {
  brandId: string;
  brandName: string;
  imageRole: 'logo' | 'cover' | 'gallery' | 'thumbnail' | 'hero' | 'banner';
  imageType: 'brand' | 'product' | 'collection' | 'user';
  originalFilename?: string;
  userId?: string;
}

export interface ImagePathInfo {
  filename: string;
  storagePath: string;
  publicUrl: string;
  bucket: string;
}

/**
 * Generate consistent filename for brand images
 * Format: {brandId}_{brandSlug}_{role}_{timestamp}.{extension}
 * Example: ehbs-couture_ehbs-couture_logo_1703123456789.jpg
 */
export function generateBrandImageFilename(
  config: ImageNamingConfig,
  file: File
): string {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Create brand slug (URL-friendly version of brand name)
  const brandSlug = config.brandName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Generate filename
  const filename = `${config.brandId}_${brandSlug}_${config.imageRole}_${timestamp}.${fileExtension}`;
  
  return filename;
}

/**
 * Generate storage path for brand images
 * Format: brands/{brandId}/{role}/{filename}
 * Example: brands/ehbs-couture/logo/ehbs-couture_ehbs-couture_logo_1703123456789.jpg
 */
export function generateBrandImagePath(
  config: ImageNamingConfig,
  filename: string
): string {
  return `brands/${config.brandId}/${config.imageRole}/${filename}`;
}

/**
 * Generate consistent filename for product images
 * Format: {brandId}_{productId}_{role}_{timestamp}.{extension}
 * Example: ehbs-couture_prod_123_logo_1703123456789.jpg
 */
export function generateProductImageFilename(
  brandId: string,
  productId: string,
  role: 'main' | 'gallery' | 'detail' | 'thumbnail',
  file: File
): string {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  return `${brandId}_prod_${productId}_${role}_${timestamp}.${fileExtension}`;
}

/**
 * Generate storage path for product images
 * Format: products/{brandId}/{productId}/{filename}
 */
export function generateProductImagePath(
  brandId: string,
  productId: string,
  filename: string
): string {
  return `products/${brandId}/${productId}/${filename}`;
}

/**
 * Generate consistent filename for collection images
 * Format: {brandId}_{collectionId}_{role}_{timestamp}.{extension}
 */
export function generateCollectionImageFilename(
  brandId: string,
  collectionId: string,
  role: 'cover' | 'gallery' | 'thumbnail',
  file: File
): string {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  return `${brandId}_coll_${collectionId}_${role}_${timestamp}.${fileExtension}`;
}

/**
 * Generate storage path for collection images
 * Format: collections/{brandId}/{collectionId}/{filename}
 */
export function generateCollectionImagePath(
  brandId: string,
  collectionId: string,
  filename: string
): string {
  return `collections/${brandId}/${collectionId}/${filename}`;
}

/**
 * Generate consistent filename for user profile images
 * Format: users/{userId}_{role}_{timestamp}.{extension}
 */
export function generateUserImageFilename(
  userId: string,
  role: 'avatar' | 'profile' | 'cover',
  file: File
): string {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  return `${userId}_${role}_${timestamp}.${fileExtension}`;
}

/**
 * Generate storage path for user images
 * Format: users/{userId}/{filename}
 */
export function generateUserImagePath(
  userId: string,
  filename: string
): string {
  return `users/${userId}/${filename}`;
}

/**
 * Parse filename to extract metadata
 * Useful for identifying image ownership and purpose
 */
export function parseImageFilename(filename: string): {
  brandId?: string;
  brandSlug?: string;
  role?: string;
  timestamp?: number;
  productId?: string;
  collectionId?: string;
  userId?: string;
  imageType?: string;
} | null {
  // Remove file extension
  const nameWithoutExt = filename.split('.')[0];
  const parts = nameWithoutExt.split('_');
  
  if (parts.length < 3) return null;
  
  const result: any = {};
  
  // Check if it's a brand image
  if (parts[1] && parts[1].match(/^[a-z0-9-]+$/)) {
    // Format: {brandId}_{brandSlug}_{role}_{timestamp}
    result.brandId = parts[0];
    result.brandSlug = parts[1];
    result.role = parts[2];
    result.timestamp = parseInt(parts[3]) || undefined;
    result.imageType = 'brand';
  }
  // Check if it's a product image
  else if (parts[1] === 'prod') {
    // Format: {brandId}_prod_{productId}_{role}_{timestamp}
    result.brandId = parts[0];
    result.productId = parts[2];
    result.role = parts[3];
    result.timestamp = parseInt(parts[4]) || undefined;
    result.imageType = 'product';
  }
  // Check if it's a collection image
  else if (parts[1] === 'coll') {
    // Format: {brandId}_coll_{collectionId}_{role}_{timestamp}
    result.brandId = parts[0];
    result.collectionId = parts[2];
    result.role = parts[3];
    result.timestamp = parseInt(parts[4]) || undefined;
    result.imageType = 'collection';
  }
  // Check if it's a user image
  else if (parts[1] && parts[1].match(/^(avatar|profile|cover)$/)) {
    // Format: {userId}_{role}_{timestamp}
    result.userId = parts[0];
    result.role = parts[1];
    result.timestamp = parseInt(parts[2]) || undefined;
    result.imageType = 'user';
  }
  
  return result;
}

/**
 * Get bucket name based on image type
 */
export function getBucketForImageType(imageType: string): string {
  switch (imageType) {
    case 'brand':
      return 'brand-assets';
    case 'product':
      return 'product-images';
    case 'collection':
      return 'collection-images';
    case 'user':
      return 'user-assets';
    default:
      return 'brand-assets';
  }
}

/**
 * Validate filename follows naming convention
 */
export function validateImageFilename(filename: string): boolean {
  const metadata = parseImageFilename(filename);
  return metadata !== null;
}

/**
 * Get human-readable description of image from filename
 */
export function getImageDescription(filename: string): string {
  const metadata = parseImageFilename(filename);
  
  if (!metadata) return 'Unknown image';
  
  const roleNames: { [key: string]: string } = {
    logo: 'Logo',
    cover: 'Cover Image',
    gallery: 'Gallery Image',
    thumbnail: 'Thumbnail',
    hero: 'Hero Image',
    banner: 'Banner',
    main: 'Main Image',
    detail: 'Detail Image',
    avatar: 'Profile Picture',
    profile: 'Profile Image'
  };
  
  const roleName = roleNames[metadata.role || ''] || metadata.role || 'Image';
  
  if (metadata.imageType === 'brand') {
    return `${roleName} for brand ${metadata.brandSlug || metadata.brandId}`;
  } else if (metadata.imageType === 'product') {
    return `${roleName} for product ${metadata.productId}`;
  } else if (metadata.imageType === 'collection') {
    return `${roleName} for collection ${metadata.collectionId}`;
  } else if (metadata.imageType === 'user') {
    return `${roleName} for user ${metadata.userId}`;
  }
  
  return roleName;
}
