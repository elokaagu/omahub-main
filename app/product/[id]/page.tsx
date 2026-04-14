import { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Product } from "@/lib/supabase";
import { generateSEOMetadata } from "@/lib/seo";
import { getCachedProductWithBrand } from "@/lib/product/getProductWithBrandCached";
import { getProductOgImageUrl } from "@/lib/utils/productImageUtils";
import ClientProductPage from "./ClientProductPage";

interface ProductPageProps {
  params: { id: string };
}

function metaKeywords(
  product: Product,
  brandName: string,
  brandLocation: string | null | undefined
): string[] {
  const materials = Array.isArray(product.materials) ? product.materials : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];

  return [
    product.title.toLowerCase(),
    product.category?.toLowerCase() || "",
    brandName.toLowerCase(),
    (brandLocation ?? "").toLowerCase(),
    "fashion",
    "premium",
    "designer",
    "clothing",
    ...materials.map((m) => String(m).toLowerCase()),
    ...colors.map((c) => String(c).toLowerCase()),
  ].filter(Boolean);
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  try {
    const data = await getCachedProductWithBrand(params.id);

    if (!data) {
      return {
        title: "Product Not Found | OmaHub",
        description: "The product you're looking for could not be found.",
      };
    }

    const { product, brand } = data;

    const description =
      product.description ||
      `Discover ${product.title} by ${brand.name}. ${product.category ? `Premium ${product.category.toLowerCase()} ` : ""}available on OmaHub.`;

    const mainImage = getProductOgImageUrl(product);

    const currency =
      (product.currency && String(product.currency).trim()) ||
      (brand.currency && String(brand.currency).trim()) ||
      "";

    const displayPrice =
      product.sale_price != null ? product.sale_price : product.price;
    const hasVerifiedOffer =
      currency !== "" &&
      typeof displayPrice === "number" &&
      !Number.isNaN(displayPrice);

    return generateSEOMetadata({
      title: `${product.title} - ${brand.name} | Premium Fashion`,
      description,
      keywords: metaKeywords(product, brand.name, brand.location),
      url: `/product/${params.id}`,
      type: "product",
      image: mainImage,
      author: brand.name,
      brand: brand.name,
      category: product.category,
      ...(hasVerifiedOffer
        ? { price: displayPrice, currency }
        : {}),
      availability: product.in_stock ? "in stock" : "out of stock",
    });
  } catch (error) {
    console.error("Error generating metadata for product:", error);
    return {
      title: "Product | OmaHub",
      description: "Discover premium fashion products on OmaHub.",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const data = await getCachedProductWithBrand(params.id);

    if (!data) {
      notFound();
    }

    return (
      <ClientProductPage
        productId={params.id}
        initialProduct={data.product}
        initialBrand={data.brand}
      />
    );
  } catch (error) {
    console.error("Error loading product page (treating as not found):", error);
    notFound();
  }
}
