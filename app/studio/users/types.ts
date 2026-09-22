export interface UserProfile {
  id: string;
  email: string;
  role: string;
  owned_brands: string[];
  created_at: string;
  updated_at: string;
}

export interface UserWithBrands extends UserProfile {
  brand_names: string[];
}

/** What the "Assign brands" picker needs per brand. */
export type BrandOption = { id: string; name: string };

export const ROLE_OPTIONS = [
  { value: "user", label: "User", plural: "Users" },
  { value: "brand_admin", label: "Brand Admin", plural: "Brand Admins" },
  { value: "admin", label: "Admin", plural: "Admins" },
  { value: "super_admin", label: "Super Admin", plural: "Super Admins" },
] as const;
