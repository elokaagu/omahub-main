export interface HomeBrand {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  is_verified: boolean;
  category: string;
}

export interface BrandDisplay {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  isVerified: boolean;
  category: string;
  video_url?: string;
  video_thumbnail?: string;
}

export interface CategoryWithBrands {
  title: string;
  image: string;
  href: string;
  customCta: string;
  brands: BrandDisplay[];
}

export interface CarouselItem {
  id: string | number;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  heroTitle: string;
  isEditorial?: boolean;
  width: number;
  height: number;
}
