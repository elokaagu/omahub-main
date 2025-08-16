"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Star } from "@/components/ui/icons";
import {
  ShoppingBag,
  Instagram,
  Globe,
  MessageCircle,
  Mail,
} from "lucide-react";
import ContactDesignerModal from "@/components/ContactDesignerModal";
import { ReviewForm } from "@/components/ui/review-form";
import { ReviewDisplay } from "@/components/ui/review-display";
import useReviews from "@/lib/hooks/useReviews";
import type { BrandData } from "@/lib/data/brands";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NavigationLink } from "@/components/ui/navigation-link";
import { getProductsByBrand } from "@/lib/services/productService";
import { Product } from "@/lib/supabase";
import { LazyImage } from "@/components/ui/lazy-image";
import WhatsAppContact from "@/components/ui/whatsapp-contact";
import {
  isValidWhatsAppNumber,
  formatPhoneForDisplay,
} from "@/lib/utils/phoneUtils";
import { FavouriteButton } from "@/components/ui/favourite-button";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import { getProductMainImage } from "@/lib/utils/productImageUtils";

interface ClientBrandProfileProps {
  brandData: BrandData;
}

export default function ClientBrandProfile({
  brandData,
}: ClientBrandProfileProps) {
  const { user } = useAuth();
  const params = useParams();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : null;

  console.log("Brand params:", params);
  console.log("Extracted brand ID:", id);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { reviews, loading, error, fetchReviews } = useReviews(id as string);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

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
  const fetchProducts = async () => {
    if (!id) return;

    try {
      setProductsLoading(true);
      const brandProducts = await getProductsByBrand(id);
      setProducts(brandProducts);
    } catch (error) {
      console.error("Error fetching brand products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch reviews when component mounts
  useEffect(() => {
    console.log("Fetching reviews for brand ID:", id);
    if (id) {
      fetchReviews();
    }
  }, [fetchReviews, id]);

  // Show products by default if there are no collections
  useEffect(() => {
    if (brandData.collections.length === 0) {
      setShowAllProducts(true);
    }
  }, [brandData.collections]);

  // Fetch products when showAllProducts is toggled
  useEffect(() => {
    if (showAllProducts && products.length === 0) {
      fetchProducts();
    }
  }, [showAllProducts]);

  const handleReviewSubmitted = () => {
    // Hide the review form and refresh reviews
    setShowReviewForm(false);
    fetchReviews();
  };

  const handleShowReviewForm = () => {
    console.log("Opening review form for brand ID:", id);
    setShowReviewForm(true);
  };

  const handleOpenContactModal = () => {
    console.log("Opening contact modal for brand:", brandData.name);
    setIsContactModalOpen(true);
  };

  const handleToggleProducts = () => {
    setShowAllProducts(!showAllProducts);
    if (!showAllProducts) {
      // Scroll to products section when showing
      setTimeout(() => scrollToProducts(), 100);
    }
  };

  return (
    <section className="pt-20 sm:pt-24 pb-16 px-4 sm:px-6 fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 slide-up">
          <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-2">
            <Badge className="bg-oma-beige text-oma-cocoa border-oma-gold/20 text-xs sm:text-sm">
              {brandData.category}
            </Badge>
            {brandData.isVerified && (
              <div className="flex items-center text-oma-gold text-xs sm:text-sm">
                <CheckCircle size={14} className="mr-1 sm:mr-1" />
                <span>Verified Designer</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-canela font-normal tracking-tight mb-3 sm:mb-2 leading-tight">
            {brandData.name}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center text-oma-cocoa mb-4 sm:mb-6 gap-2 sm:gap-0">
            <div className="flex items-center">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              <span className="text-sm sm:text-base">{brandData.location}</span>
            </div>
            <div className="flex items-center sm:ml-6">
              <Star size={14} className="mr-1 text-oma-gold flex-shrink-0" />
              <span className="text-sm sm:text-base">
                {brandData.rating} ({reviews.length} reviews)
              </span>
            </div>
          </div>

          <div className="prose text-oma-black max-w-none mb-6">
            {brandData.description.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                className="mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Mobile-optimized button layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {brandData.collections.length > 0 && (
              <Button
                onClick={scrollToCollections}
                className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
              >
                View Collections
              </Button>
            )}
            <Button
              onClick={handleToggleProducts}
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
            >
              <ShoppingBag size={16} className="mr-2 flex-shrink-0" />
              {showAllProducts ? "Hide Products" : "View All Products"}
            </Button>
            {/* WhatsApp Button - Only show if WhatsApp is available */}
            {brandData.whatsapp &&
              isValidWhatsAppNumber(brandData.whatsapp) && (
                <WhatsAppContact
                  phoneNumber={brandData.whatsapp}
                  brandName={brandData.name}
                  className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
                />
              )}
            {user && (
              <FavouriteButton
                itemId={brandData.id}
                itemType="brand"
                className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
              />
            )}
            <Button
              onClick={handleOpenContactModal}
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
            >
              <MessageCircle size={16} className="mr-2 flex-shrink-0" />
              Contact Designer
            </Button>
          </div>
        </div>

        {/* Products Section */}
        {showAllProducts && (
          <div
            id="products-section"
            className="my-8 sm:my-12 slide-up scroll-mt-20 sm:scroll-mt-24"
            style={{ animationDelay: "50ms" }}
          >
            <h2 className="text-2xl sm:text-3xl font-canela font-normal mb-4 sm:mb-6">
              All Products
            </h2>
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2 sm:space-y-3">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-3 sm:h-4 w-3/4" />
                    <Skeleton className="h-3 sm:h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-oma-cocoa/30 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base">
                  No products available yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {products.map((product, index) => (
                  <NavigationLink
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="block group"
                  >
                    <div
                      className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-[fadeIn_500ms_ease-in-out_forwards] opacity-0"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <LazyImage
                          src={
                            getProductMainImage(product) || "/placeholder.png"
                          }
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          priority={true}
                          aspectRatio="square"
                          quality={85}
                        />
                      </div>
                      <div className="p-3 sm:p-4">
                        <h3 className="font-medium text-sm sm:text-lg mb-1 group-hover:text-oma-plum transition-colors line-clamp-2">
                          {product.title}
                        </h3>
                        <p className="text-oma-cocoa/70 text-xs sm:text-sm mb-2 line-clamp-1">
                          {product.category}
                        </p>
                        <div className="flex items-center justify-between">
                          {product.service_type === "portfolio" ? (
                            <div></div>
                          ) : (
                            <p className="text-oma-plum font-medium text-sm sm:text-base">
                              {
                                formatProductPrice(product, {
                                  price_range: brandData.priceRange,
                                }).displayPrice
                              }
                            </p>
                          )}
                          {product.service_type !== "portfolio" && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                product.in_stock
                                  ? "bg-oma-gold text-oma-cocoa"
                                  : "bg-oma-cocoa/40 text-white"
                              }`}
                            >
                              {product.in_stock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </NavigationLink>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collections Grid */}
        {brandData.collections.length > 0 && (
          <div
            id="collections-section"
            className="my-8 sm:my-12 slide-up scroll-mt-20 sm:scroll-mt-24"
            style={{ animationDelay: "100ms" }}
          >
            <h2 className="text-2xl sm:text-3xl font-canela font-normal mb-4 sm:mb-6">
              Collections
            </h2>
            {brandData.collections.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <p className="text-sm sm:text-base">
                  No collections available yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {brandData.collections.map((collection, index) => (
                  <NavigationLink
                    key={collection.id}
                    href={`/collection/${collection.id}`}
                    className="block group"
                  >
                    <div
                      className="aspect-[4/5] relative overflow-hidden rounded-xl sm:rounded-2xl animate-[fadeIn_500ms_ease-in-out_forwards] opacity-0 transition-transform duration-300 group-hover:scale-105"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <LazyImage
                        src={collection.image}
                        alt={collection.title}
                        fill
                        className="object-cover rounded-xl sm:rounded-2xl"
                        sizes="(max-width: 768px) 100vw, 400px"
                        priority={true}
                        aspectRatio="4/5"
                        quality={85}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/70 transition-colors duration-300" />
                      <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                        <h3 className="text-white text-lg sm:text-xl font-source group-hover:text-oma-gold transition-colors duration-300">
                          {collection.title}
                        </h3>
                        <p className="text-white/80 text-xs sm:text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Click to view catalogue
                        </p>
                      </div>
                    </div>
                  </NavigationLink>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 my-8 sm:my-12 slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl font-canela font-normal mb-3 sm:mb-4">
              About {brandData.name}
            </h2>
            <div className="prose text-oma-black max-w-none">
              {brandData.longDescription.split("\n\n").map((paragraph, i) => (
                <p
                  key={i}
                  className="mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-oma-beige p-4 sm:p-6 rounded-lg h-fit order-first lg:order-last">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-canela text-xl">Designer Information</h3>

              {/* Social Icons in top right */}
              <div className="flex items-center gap-2">
                {/* Email Contact */}
                {brandData.contact_email && (
                  <button
                    onClick={() =>
                      window.open(`mailto:${brandData.contact_email}`, "_blank")
                    }
                    className="p-2 rounded-full bg-oma-beige border border-oma-gold/30 text-oma-plum hover:bg-oma-gold hover:border-oma-gold hover:text-oma-plum transition-colors"
                    title="Email Designer"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                )}

                {/* WhatsApp Contact */}
                {brandData.whatsapp &&
                  isValidWhatsAppNumber(brandData.whatsapp) && (
                    <button
                      onClick={() =>
                        window.open(
                          `https://wa.me/${brandData.whatsapp?.replace(/\D/g, "") || ""}`,
                          "_blank"
                        )
                      }
                      className="p-2 rounded-full bg-oma-beige border border-oma-gold/30 text-oma-plum hover:bg-oma-gold hover:border-oma-gold hover:text-oma-plum transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  )}

                {/* Instagram Link */}
                {brandData.instagram && (
                  <button
                    onClick={() =>
                      window.open(
                        brandData.instagram?.startsWith("http")
                          ? brandData.instagram
                          : `https://instagram.com/${brandData.instagram}`,
                        "_blank"
                      )
                    }
                    className="p-2 rounded-full bg-oma-beige border border-oma-gold/30 text-oma-plum hover:bg-oma-gold hover:border-oma-gold hover:text-oma-plum transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </button>
                )}

                {/* Website Link */}
                {brandData.website && (
                  <button
                    onClick={() =>
                      window.open(
                        brandData.website?.startsWith("http")
                          ? brandData.website
                          : `https://${brandData.website}`,
                        "_blank"
                      )
                    }
                    className="p-2 rounded-full bg-oma-beige border border-oma-gold/30 text-oma-plum hover:bg-oma-gold hover:border-oma-gold hover:text-oma-plum transition-colors"
                    title="Website"
                  >
                    <Globe className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Price Range</h4>
              <p>{brandData.priceRange}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Location</h4>
              <p>{brandData.location}</p>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-1">Category</h4>
              <p>{brandData.category}</p>
            </div>

            <Button
              onClick={handleOpenContactModal}
              className="w-full bg-oma-plum hover:bg-oma-plum/90 min-h-[44px] text-sm sm:text-base"
            >
              Contact Designer
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div
          className="my-8 sm:my-12 border border-oma-gold/20 rounded-lg p-4 sm:p-6 bg-oma-beige/30 slide-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
            <h2 className="text-2xl sm:text-3xl font-canela font-normal">
              Customer Reviews
            </h2>
            {!showReviewForm && (
              <Button
                onClick={handleShowReviewForm}
                className="bg-oma-plum hover:bg-oma-plum/90 text-white w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
              >
                Write a Review
              </Button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-8">
              <ReviewForm
                brandId={id as string}
                onReviewSubmitted={handleReviewSubmitted}
                className="mb-6"
              />
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                className="mb-6"
              >
                Cancel
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-500 rounded">{error}</div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewDisplay
                  key={review.id}
                  id={review.id}
                  author={review.author}
                  comment={review.comment}
                  rating={review.rating}
                  date={review.date}
                  created_at={review.created_at}
                  replies={review.replies}
                  showReplies={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-oma-cocoa">
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>

      <ContactDesignerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        brandName={brandData.name}
        brandId={id as string}
      />
    </section>
  );
}
