import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrandCollections, getApplicationImageUrlsForBrand } from "@/lib/services/brandService";
import {
  generateBreadcrumbStructuredData,
  generateSEOMetadata,
  generateStructuredData,
  optimizeMetaDescription,
} from "@/lib/seo";
import { resolveBrandProfileImageUrl } from "@/lib/brands/directoryListingImage";
import { JsonLd } from "@/components/seo/JsonLd";
import ClientBrandProfile from "./ClientBrandProfile";
import { getCachedBrandById } from "./cachedBrand";
import { mapBrandToProfileData } from "./brandProfileMapper";

interface BrandPageProps {
  params: { id: string };
}

const META_DESCRIPTION_MAX = 160;

function trimMetaDescription(raw: string, maxLen = META_DESCRIPTION_MAX): string {
  const single = raw.replace(/\s+/g, " ").trim();
  if (single.length <= maxLen) return single;
  const slice = single.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > 50 ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  try {
    const brand = await getCachedBrandById(params.id);

    if (!brand) {
      return {
        title: "Brand Not Found | OmaHub",
        description: "The brand you're looking for could not be found.",
      };
    }

    const rawDescription =
      brand.long_description ||
      brand.description ||
      `Discover ${brand.name}, a premium fashion brand${brand.location ? ` from ${brand.location}` : ""}. Explore their unique collections and connect with their expert team.`;

    const description = trimMetaDescription(rawDescription);
    let applicationImageUrls: string[] | undefined;
    if (!resolveBrandProfileImageUrl(brand as any)) {
      applicationImageUrls = await getApplicationImageUrlsForBrand(
        brand.name,
        brand.contact_email,
      );
    }
    const profileImage =
      resolveBrandProfileImageUrl(brand as any, applicationImageUrls) ||
      "/OmaHubBanner.png";

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
      image: profileImage,
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
  const brand = await getCachedBrandById(params.id);

  if (!brand) {
    notFound();
  }

  const collections = await getBrandCollections(params.id);
  let applicationImageUrls: string[] | undefined;
  if (!resolveBrandProfileImageUrl(brand as any)) {
    applicationImageUrls = await getApplicationImageUrlsForBrand(
      brand.name,
      brand.contact_email,
    );
  }
  const initialBrandData = mapBrandToProfileData(
    brand as any,
    collections as any,
    applicationImageUrls,
  );

  const brandImage =
    resolveBrandProfileImageUrl(brand as any, applicationImageUrls) ||
    brand.image;

  const socialLinks = [
    brand.instagram,
    brand.website,
    brand.whatsapp,
  ].filter(Boolean) as string[];

  return (
    <>
      <JsonLd
        data={[
          generateStructuredData("brand", {
            id: brand.id,
            name: brand.name,
            description: optimizeMetaDescription(
              brand.long_description || brand.description || "",
            ),
            logo: brandImage,
            images: brandImage ? [brandImage] : [],
            location: brand.location,
            socialLinks,
            foundedYear: brand.founded_year,
          }),
          generateBreadcrumbStructuredData([
            { name: "Home", url: "/" },
            { name: "Directory", url: "/directory" },
            { name: brand.name, url: `/brand/${params.id}` },
          ]),
        ]}
      />
      <ClientBrandProfile
      key={params.id}
      brandId={params.id}
      initialBrandData={initialBrandData}
    />
    </>
  );
}
