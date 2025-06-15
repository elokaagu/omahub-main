"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Star } from "@/components/ui/icons";
import { ShoppingBag } from "lucide-react";
import ContactDesignerModal from "@/components/ContactDesignerModal";
import { ReviewForm } from "@/components/ui/review-form";
import useReviews from "@/lib/hooks/useReviews";
import type { BrandData } from "@/lib/data/brands";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NavigationLink } from "@/components/ui/navigation-link";
import { getProductsByBrand } from "@/lib/services/productService";
import { Product } from "@/lib/supabase";
import Image from "next/image";

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

  // Scroll to catalogues function
  const scrollToCatalogues = () => {
    const cataloguesSection = document.getElementById("catalogues-section");
    if (cataloguesSection) {
      cataloguesSection.scrollIntoView({ behavior: "smooth" });
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
    <section className="pt-24 pb-16 px-6 fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 slide-up">
          <div className="flex items-center mb-2">
            <Badge className="bg-oma-beige text-oma-cocoa border-oma-gold/20">
              {brandData.category}
            </Badge>
            {brandData.isVerified && (
              <div className="flex items-center ml-3 text-oma-gold text-sm">
                <CheckCircle size={16} className="mr-1" />
                <span>Verified Designer</span>
              </div>
            )}
          </div>

          <h1 className="heading-lg mb-2">{brandData.name}</h1>

          <div className="flex items-center text-oma-cocoa mb-6">
            <MapPin size={16} className="mr-1" />
            <span>{brandData.location}</span>
            <div className="flex items-center ml-6">
              <Star size={16} className="mr-1 text-oma-gold" />
              <span>
                {brandData.rating} ({reviews.length} reviews)
              </span>
            </div>
          </div>

          <div className="prose text-oma-black max-w-none">
            {brandData.description.split("\n\n").map((paragraph, i) => (
              <p key={i} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={scrollToCatalogues}
              className="bg-oma-plum hover:bg-oma-plum/90"
            >
              View Catalogues
            </Button>
            <Button
              onClick={handleToggleProducts}
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
            >
              <ShoppingBag size={16} className="mr-2" />
              {showAllProducts ? "Hide Products" : "View All Products"}
            </Button>
            <Button
              onClick={handleOpenContactModal}
              variant="outline"
              className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
            >
              Contact Designer
            </Button>
          </div>
        </div>

        {/* Products Section */}
        {showAllProducts && (
          <div
            id="products-section"
            className="my-12 slide-up scroll-mt-24"
            style={{ animationDelay: "50ms" }}
          >
            <h2 className="heading-sm mb-6">All Products</h2>
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingBag className="w-16 h-16 text-oma-cocoa/30 mx-auto mb-4" />
                <p>No products available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <NavigationLink
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="block group"
                  >
                    <div
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-[fadeIn_500ms_ease-in-out_forwards] opacity-0"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <Image
                          src={product.image || "/placeholder.png"}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-lg mb-1 group-hover:text-oma-plum transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-oma-cocoa/70 text-sm mb-2">
                          {product.category}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-oma-plum font-medium">
                            ${product.sale_price || product.price}
                          </p>
                          <Badge
                            variant="secondary"
                            className={
                              product.in_stock
                                ? "bg-oma-gold text-oma-cocoa"
                                : "bg-oma-cocoa/40 text-white"
                            }
                          >
                            {product.in_stock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </NavigationLink>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Catalogue Grid */}
        <div
          id="catalogues-section"
          className="my-12 slide-up scroll-mt-24"
          style={{ animationDelay: "100ms" }}
        >
          <h2 className="heading-sm mb-6">Catalogues</h2>
          {brandData.collections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No catalogues available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brandData.collections.map((collection, index) => (
                <NavigationLink
                  key={collection.id}
                  href={`/catalogue/${collection.id}`}
                  className="block group"
                >
                  <div
                    className="aspect-[4/5] relative overflow-hidden rounded-2xl animate-[fadeIn_500ms_ease-in-out_forwards] opacity-0 transition-transform duration-300 group-hover:scale-105"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/70 transition-colors duration-300" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <h3 className="text-white text-xl font-source group-hover:text-oma-gold transition-colors duration-300">
                        {collection.title}
                      </h3>
                      <p className="text-white/80 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Click to view catalogue
                      </p>
                    </div>
                  </div>
                </NavigationLink>
              ))}
            </div>
          )}
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12 slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="md:col-span-2">
            <h2 className="heading-sm mb-4">About {brandData.name}</h2>
            <div className="prose text-oma-black max-w-none">
              {brandData.longDescription.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-oma-beige p-6 rounded-lg h-fit">
            <h3 className="font-canela text-xl mb-4">Designer Information</h3>

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

            <Separator className="my-6 bg-oma-gold/20" />

            <Button
              onClick={handleOpenContactModal}
              className="w-full bg-oma-plum hover:bg-oma-plum/90"
            >
              Contact Designer
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div
          className="my-12 border border-oma-gold/20 rounded-lg p-6 bg-oma-beige/30 slide-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="heading-sm">Customer Reviews</h2>
            {!showReviewForm && (
              <Button
                onClick={handleShowReviewForm}
                className="bg-oma-plum hover:bg-oma-plum/90 text-white"
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
                <div
                  key={review.id}
                  className="border-b border-oma-gold/10 last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < review.rating
                              ? "text-oma-gold fill-oma-gold"
                              : "text-oma-gold/20"
                          }
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-oma-cocoa">
                      {review.date}
                    </span>
                  </div>
                  <p className="text-oma-black mb-2">{review.comment}</p>
                  <p className="text-sm text-oma-cocoa">- {review.author}</p>
                </div>
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
      />
    </section>
  );
}
