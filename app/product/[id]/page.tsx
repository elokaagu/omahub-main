import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/services/productService";
import { getBrandById } from "@/lib/services/brandService";
import { generateMetadata } from "@/lib/seo";
import ClientProductPage from "./ClientProductPage";

interface ProductPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  try {
    const product = await getProductById(params.id);

    if (!product) {
      return {
        title: "Product Not Found | OmaHub",
        description: "The product you're looking for could not be found.",
      };
    }

    const brand = product.brand_id
      ? await getBrandById(product.brand_id)
      : null;

    const description =
      product.description ||
      `Discover ${product.title}${brand ? ` by ${brand.name}` : ""}. ${product.category ? `Premium ${product.category.toLowerCase()} ` : ""}available on OmaHub.`;

    const images = Array.isArray(product.images) ? product.images : [];
    const mainImage = images.length > 0 ? images[0] : "/OmaHubBanner.png";

    return generateMetadata({
      title: `${product.title}${brand ? ` - ${brand.name}` : ""} | Premium Fashion`,
      description: description,
      keywords: [
        product.title.toLowerCase(),
        product.category?.toLowerCase() || "",
        brand?.name.toLowerCase() || "",
        brand?.location?.toLowerCase() || "",
        "fashion",
        "premium",
        "designer",
        "clothing",
        ...(product.materials || []).map((m) => m.toLowerCase()),
        ...(product.colors || []).map((c) => c.toLowerCase()),
      ].filter(Boolean),
      url: `/product/${params.id}`,
      type: "product",
      image: mainImage,
      author: brand?.name,
      brand: brand?.name,
      category: product.category,
      price: product.price,
      currency: product.currency || brand?.currency || "USD",
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
    const product = await getProductById(params.id);

    if (!product) {
      notFound();
    }

    return <ClientProductPage productId={params.id} />;
  } catch (error) {
    console.error("Error loading product page:", error);
    notFound();
  }
}
