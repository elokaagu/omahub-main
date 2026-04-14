export interface BrandProfileCollection {
  id: string | number;
  title: string;
  image: string;
  description?: string;
}

export interface BrandProfileData {
  id: string;
  name: string;
  description: string;
  longDescription?: string | null;
  location?: string;
  priceRange?: string;
  category?: string;
  rating?: number;
  isVerified?: boolean;
  image?: string;
  collections: BrandProfileCollection[];
  website?: string | null;
  instagram?: string;
  whatsapp?: string;
  contact_email?: string;
  currency?: string;
}

export interface BrandProduct {
  id: string;
  title: string;
  category?: string;
  service_type?: string;
  in_stock?: boolean;
  [key: string]: unknown;
}
