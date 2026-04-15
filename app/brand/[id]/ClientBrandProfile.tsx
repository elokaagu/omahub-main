"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import ContactDesignerModal from "@/components/ContactDesignerModal";
import useReviews from "@/lib/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { getProductsByBrand } from "@/lib/services/productService";
import { getBrandById, getBrandCollections } from "@/lib/services/brandService";
import { toast } from "sonner";
import { Review } from "@/lib/hooks/useReviews";
import { mapBrandToProfileData } from "./brandProfileMapper";
import { BrandHeaderSection } from "./BrandHeaderSection";
import { BrandProductsSection } from "./BrandProductsSection";
import { BrandCollectionsSection } from "./BrandCollectionsSection";
import { BrandInfoSection } from "./BrandInfoSection";
import { BrandReviewsSection } from "./BrandReviewsSection";
import type { BrandProduct, BrandProfileData } from "./types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageIcon } from "lucide-react";

interface ClientBrandProfileProps {
  brandId: string;
  /** When provided (from the server page), skips the initial client brand/collections fetch. */
  initialBrandData?: BrandProfileData;
  onReviewSubmitted?: () => Promise<void>;
}

export default function ClientBrandProfile({
  brandId,
  initialBrandData,
  onReviewSubmitted,
}: ClientBrandProfileProps) {
  const { user } = useAuth();

  const [brandData, setBrandData] = useState<BrandProfileData | null>(
    initialBrandData ?? null
  );
  const [loading, setLoading] = useState(!initialBrandData);
  const [error, setError] = useState<Error | null>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const {
    reviews: hookReviews,
    loading: reviewsLoading,
    error: reviewsError,
    fetchReviews,
  } = useReviews(brandId);
  const [optimisticReviews, setOptimisticReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const reviews = useMemo(() => {
    const hookIds = new Set(
      hookReviews.map((r) => r.id).filter(Boolean) as string[]
    );
    const pending = optimisticReviews.filter(
      (r) => !r.id || !hookIds.has(r.id)
    );
    return [...pending, ...hookReviews];
  }, [optimisticReviews, hookReviews]);

  // Scroll to collections function
  const scrollToCollections = () => {
    const collectionsSection = document.getElementById("collections-section");
    if (collectionsSection) {
      collectionsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to products function
  const scrollToProducts = () => {
    const productsSection = document.getElementById("products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fetch products for this brand
  const fetchProducts = useCallback(async () => {
    if (!brandId) return;

    try {
      setProductsLoading(true);
      const brandProducts = await getProductsByBrand(brandId);
      setProducts(brandProducts);
    } catch (error) {
      console.error("Error fetching brand products:", error);
    } finally {
      setProductsLoading(false);
    }
  }, [brandId]);

  // Fetch reviews when component mounts
  useEffect(() => {
    if (brandId) {
      fetchReviews();
    }
  }, [fetchReviews, brandId]);

  // Show products by default if there are no collections
  useEffect(() => {
    if (brandData && brandData.collections.length === 0) {
      setShowAllProducts(true);
    }
  }, [brandData]);

  // Fetch products when showAllProducts is toggled
  useEffect(() => {
    if (showAllProducts && products.length === 0) {
      fetchProducts();
    }
  }, [showAllProducts, products.length, fetchProducts]);

  // Fetch brand data only when the server did not preload it (e.g. legacy usage or missing prop).
  useEffect(() => {
    if (initialBrandData) {
      return;
    }

    async function fetchBrandData() {
      if (!brandId) return;

      try {
        setLoading(true);
        const [brand, collections] = await Promise.all([
          getBrandById(brandId),
          getBrandCollections(brandId),
        ]);

        if (brand) {
          const formattedBrandData: BrandProfileData = mapBrandToProfileData(
            brand as any,
            collections as any
          );
          setBrandData(formattedBrandData);
        }
      } catch (err) {
        console.error("Error fetching brand data:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrandData();
  }, [brandId, initialBrandData]);

  const handleReviewSubmitted = () => {
    // Hide the review form and refresh reviews
    setShowReviewForm(false);

    if (brandId) {
      fetchReviews();
    }

    // Refresh parent brand data (including reviews)
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }

    // Show success message
    toast.success(
      "Review submitted successfully! Thank you for sharing your experience."
    );
  };

  const handleReviewAdded = (newReview: Review) => {
    setOptimisticReviews((prev) => [newReview, ...prev]);

    // Hide the review form
    setShowReviewForm(false);

    // Show success message
    toast.success(
      "Review submitted successfully! Thank you for sharing your experience."
    );

    // Refresh parent brand data (including reviews)
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  const handleShowReviewForm = () => {
    setShowReviewForm(true);
  };

  const handleOpenContactModal = () => {
    setIsContactModalOpen(true);
  };

  const handleToggleProducts = () => {
    setShowAllProducts(!showAllProducts);
    if (!showAllProducts) {
      // Scroll to products section when showing
      setTimeout(() => scrollToProducts(), 100);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Error state
  if (error || !brandData) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-canela mb-4">Brand Not Found</h1>
        <p className="text-oma-cocoa/80 mb-8">
          Sorry, we couldn't find the brand you're looking for.
        </p>
        <Button
          asChild
          className="bg-oma-plum hover:bg-oma-plum/90 text-white px-6 py-2 rounded-lg"
        >
          <Link href="/directory">Browse All Brands</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="pt-20 sm:pt-24 pb-16 px-4 sm:px-6 fade-in">
      <div className="max-w-7xl mx-auto">
        {brandData.showDirectoryImageNotice ? (
          <Alert className="mb-6 sm:mb-8 border-oma-gold/35 bg-oma-beige/60 text-oma-cocoa shadow-sm">
            <ImageIcon className="h-4 w-4 text-oma-plum" aria-hidden />
            <AlertTitle className="text-oma-plum font-canela text-base">
              Not listed in the Brand Directory yet
            </AlertTitle>
            <AlertDescription className="text-oma-cocoa/90 text-sm mt-1">
              This profile is still visible at this link, but it will not appear
              on the public directory until a cover image is published in Studio
              (upload brand images for this brand). Add at least one image so
              visitors see your work in the directory grid.
            </AlertDescription>
          </Alert>
        ) : null}
        <BrandHeaderSection
          brandData={brandData}
          reviewsCount={reviews.length}
          showAllProducts={showAllProducts}
          onScrollToCollections={scrollToCollections}
          onToggleProducts={handleToggleProducts}
          onOpenContactModal={handleOpenContactModal}
        />

        <BrandProductsSection
          showAllProducts={showAllProducts}
          productsLoading={productsLoading}
          products={products}
          brandData={brandData}
        />

        <BrandCollectionsSection collections={brandData.collections} />

        <BrandInfoSection
          brandData={brandData}
          onOpenContactModal={handleOpenContactModal}
        />

        <BrandReviewsSection
          user={user}
          showReviewForm={showReviewForm}
          brandId={brandId}
          reviewsLoading={reviewsLoading}
          reviewsError={reviewsError}
          reviews={reviews}
          onShowReviewForm={handleShowReviewForm}
          onCancelReviewForm={() => setShowReviewForm(false)}
          onReviewSubmitted={handleReviewSubmitted}
          onReviewAdded={handleReviewAdded}
        />
      </div>

      <ContactDesignerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        brandName={brandData.name}
        brandId={brandId}
      />
    </section>
  );
}
