import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrandById } from "@/lib/services/brandService";
import { generateSEOMetadata } from "@/lib/seo";
import ClientBrandProfile from "./ClientBrandProfile";

interface BrandPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  try {
    const brand = await getBrandById(params.id);

    if (!brand) {
      return {
        title: "Brand Not Found | OmaHub",
        description: "The brand you're looking for could not be found.",
      };
    }

    const description =
      brand.long_description ||
      brand.description ||
      `Discover ${brand.name}, a premium fashion brand${brand.location ? ` from ${brand.location}` : ""}. Explore their unique collections and connect with their expert team.`;

    return generateSEOMetadata({
      title: `${brand.name} - Premium Fashion Brand`,
      description: description,
      keywords: [
        brand.name.toLowerCase(),
        "fashion brand",
        "designer",
        brand.category?.toLowerCase() || "",
        brand.location?.toLowerCase() || "",
        "premium fashion",
        "African fashion",
        "bespoke clothing",
        "custom fashion",
      ].filter(Boolean),
      url: `/brand/${params.id}`,
      type: "profile",
      image: brand.brand_images?.[0]?.storage_path
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${brand.brand_images[0].storage_path}`
        : brand.image,
      author: brand.name,
      brand: brand.name,
      category: brand.category,
    });
  } catch (error) {
    console.error("Error generating metadata for brand:", error);
    return {
      title: "Brand | OmaHub",
      description: "Discover premium fashion brands on OmaHub.",
    };
  }
}

export default async function BrandPage({ params }: BrandPageProps) {
  try {
    const brand = await getBrandById(params.id);

    if (!brand) {
      notFound();
    }

    return <ClientBrandProfile brandId={params.id} />;
  } catch (error) {
    console.error("Error loading brand page:", error);
    notFound();
  }
}
