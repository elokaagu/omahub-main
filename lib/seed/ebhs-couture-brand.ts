/**
 * Seed payload for Ebhs Couture. Used only by POST /api/add-brand (super-admin).
 * Prefer migrations or dashboard tools for ongoing brand management.
 */
export const EBHS_COUTURE_BRAND_UPSERT = {
  id: "ebhs-couture",
  name: "Ebhs Couture",
  description:
    "Exquisite couture designs for the modern woman, blending traditional craftsmanship with contemporary elegance.",
  long_description:
    "Ebhs Couture creates show stopping pieces that celebrate the modern woman. Our designs blend traditional African craftsmanship with contemporary silhouettes, using luxurious fabrics and intricate details. Each piece is meticulously crafted to make you feel confident and beautiful for any special occasion.",
  category: "Fashion Designer",
  location: "Abuja, Nigeria",
  price_range: "₦50,000 - ₦500,000",
  contact_email: "hello@ebhscouture.com",
  contact_phone: "+234-803-123-4567",
  website: "https://ebhscouture.com",
  instagram: "@ebhscouture",
  rating: 4.8,
  is_verified: true,
  image:
    "https://gqwduyodzqgucjscilvz.supabase.co/storage/v1/object/public/brand-assets/brands/ebhs-couture-hero.jpg",
} as const;
