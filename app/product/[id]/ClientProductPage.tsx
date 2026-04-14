"use client";

import { useState, useEffect } from "react";
import { NavigationLink } from "@/components/ui/navigation-link";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft } from "lucide-react";
import type { Product, Brand } from "@/lib/supabase";
import { getSpotlightVideoForBrandName } from "@/lib/services/spotlightService";
import {
  type MediaSelection,
  defaultMediaSelection,
} from "@/lib/product/productMediaSelection";
import { useProductPageData } from "./useProductPageData";
import { ProductMediaGallery } from "./ProductMediaGallery";
import { ProductDetailColumn } from "./ProductDetailColumn";
import { getProductGalleryImageList } from "@/lib/utils/productImageUtils";

interface ClientProductPageProps {
  productId: string;
  initialProduct: Product;
  initialBrand: Brand;
}

export default function ClientProductPage({
  productId,
  initialProduct,
  initialBrand,
}: ClientProductPageProps) {
  const { product, brand, loading, error } = useProductPageData(
    productId,
    initialProduct,
    initialBrand
  );
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [mediaSelection, setMediaSelection] = useState<MediaSelection>({
    kind: "image",
    index: 0,
  });
  const [spotlightVideo, setSpotlightVideo] = useState<{
    url: string;
    thumbnail?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!product || product.video_url || !brand) {
        if (!cancelled) setSpotlightVideo(null);
        return;
      }
      const v = await getSpotlightVideoForBrandName(brand.name);
      if (!cancelled) setSpotlightVideo(v);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [product?.id, product?.video_url, brand?.id, brand?.name]);

  useEffect(() => {
    setMediaSelection(
      defaultMediaSelection(!!product?.video_url, !!spotlightVideo?.url)
    );
  }, [product?.video_url, spotlightVideo?.url]);

  const productImages = product ? getProductGalleryImageList(product) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 sm:px-6">
          <div className="flex h-64 items-center justify-center">
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !brand) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16 sm:px-6">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              {error || "Product not found"}
            </h1>
            <NavigationLink href="/directory">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Directory
              </Button>
            </NavigationLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center gap-2 text-sm text-gray-600">
          <NavigationLink href="/directory" className="hover:text-oma-plum">
            Directory
          </NavigationLink>
          <span>/</span>
          <NavigationLink
            href={`/brand/${brand.id}`}
            className="hover:text-oma-plum"
          >
            {brand.name}
          </NavigationLink>
          <span>/</span>
          <span className="text-gray-900">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <ProductMediaGallery
            product={product}
            productImages={productImages}
            spotlightVideo={spotlightVideo}
            selection={mediaSelection}
            onSelect={setMediaSelection}
          />
          <ProductDetailColumn
            product={product}
            brand={brand}
            showOrderModal={showOrderModal}
            onOpenOrderModal={() => setShowOrderModal(true)}
            onCloseOrderModal={() => setShowOrderModal(false)}
          />
        </div>
      </div>
    </div>
  );
}
