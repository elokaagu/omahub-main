"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProductById } from "@/lib/services/productService";
import { getBrandById } from "@/lib/services/brandService";
import {
  getSpotlightContent,
  getAllSpotlightContent,
} from "@/lib/services/spotlightService";
import { Product, Brand } from "@/lib/supabase";
import { AuthImage } from "@/components/ui/auth-image";
import { VideoPlayer } from "@/components/ui/video-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { NavigationLink } from "@/components/ui/navigation-link";
import { TailoredOrderModal } from "@/components/product/TailoredOrderModal";
import {
  Ruler,
  Clock,
  MapPin,
  CheckCircle,
  Star,
  ArrowLeft,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatProductPrice } from "@/lib/utils/priceFormatter";
import AddToBasketButton from "@/components/ui/add-to-basket-button";
import { FavouriteButton } from "@/components/ui/favourite-button";

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavourited, setIsFavourited] = useState(false);
  const [spotlightVideo, setSpotlightVideo] = useState<{
    url: string;
    thumbnail?: string;
  } | null>(null);

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  // Fetch spotlight video if product has none
  useEffect(() => {
    async function fetchSpotlightVideo() {
      if (product && !product.video_url && brand) {
        // Try to find a spotlight for this brand
        const allSpotlights = await getAllSpotlightContent();
        const brandSpotlight = allSpotlights.find(
          (s) =>
            s.brand_name?.toLowerCase() === brand.name.toLowerCase() &&
            s.video_url
        );
        if (brandSpotlight && brandSpotlight.video_url) {
          setSpotlightVideo({
            url: brandSpotlight.video_url,
            thumbnail: brandSpotlight.video_thumbnail || "",
          });
        }
      }
    }
    fetchSpotlightVideo();
  }, [product, brand]);

  // Auto-select video when product or spotlight has video
  useEffect(() => {
    if (product?.video_url) {
      setSelectedImage(-1);
    } else if (spotlightVideo?.url) {
      setSelectedImage(-2);
    }
  }, [product?.video_url, spotlightVideo]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add cache-busting timestamp to ensure fresh data
      const timestamp = Date.now();
      console.log(`🔄 Fetching product data at ${new Date(timestamp).toISOString()}`);

      const productData = await getProductById(productId);
      if (!productData) {
        setError("Product not found");
        return;
      }

      console.log('📦 Product data fetched:', {
        title: productData.title,
        price: productData.price,
        currency: productData.currency
      });

      const brandData = await getBrandById(productData.brand_id);
      if (!brandData) {
        setError("Brand information not found");
        return;
      }

      console.log('🏷️ Brand data fetched:', {
        name: brandData.name,
        currency: brandData.currency,
        price_range: brandData.price_range
      });

      setProduct(productData);
      setBrand(brandData);
    } catch (err) {
      console.error("Error fetching product data:", err);
      setError("Failed to load product information");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = () => {
    console.log("🔍 Opening modal with product:", {
      id: product?.id,
      title: product?.title,
      description: product?.description
    });
    setShowOrderModal(true);
  };

  const productImages =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
        ? [product.image]
        : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-16">
          <div className="flex justify-center items-center h-64">
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !brand) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || "Product not found"}
            </h1>
            <NavigationLink href="/directory">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Directory
              </Button>
            </NavigationLink>
          </div>
        </div>
      </div>
    );
  }

  const safeSrc: string =
    typeof spotlightVideo?.thumbnail === "string"
      ? spotlightVideo.thumbnail
      : typeof product?.image === "string"
        ? product.image
        : "";

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images and Video */}
          <div className="space-y-4">
            <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-100">
              {product.video_url &&
              (selectedImage === -1 || selectedImage === 0) ? (
                <VideoPlayer
                  videoUrl={product.video_url}
                  thumbnailUrl={
                    product.video_thumbnail &&
                    !product.video_thumbnail.includes(".mp4") &&
                    !product.video_thumbnail.includes(".mov") &&
                    !product.video_thumbnail.includes(".avi")
                      ? product.video_thumbnail
                      : undefined
                  }
                  fallbackImageUrl={
                    product.image &&
                    !product.image.includes(".mp4") &&
                    !product.image.includes(".mov") &&
                    !product.image.includes(".avi")
                      ? product.image
                      : "/placeholder.jpg"
                  }
                  alt={product.title}
                  className="w-full h-full"
                  aspectRatio="3/4"
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  controls={false}
                  showPlayButton={false}
                  priority={true}
                  quality={95}
                  onVideoError={() => {
                    console.warn(
                      "Video failed to load for product:",
                      product.title
                    );
                  }}
                />
              ) : spotlightVideo?.url && selectedImage === -2 ? (
                <VideoPlayer
                  videoUrl={spotlightVideo.url}
                  thumbnailUrl={
                    spotlightVideo.thumbnail &&
                    !spotlightVideo.thumbnail.includes(".mp4") &&
                    !spotlightVideo.thumbnail.includes(".mov") &&
                    !spotlightVideo.thumbnail.includes(".avi")
                      ? spotlightVideo.thumbnail
                      : undefined
                  }
                  fallbackImageUrl={
                    product.image &&
                    !product.image.includes(".mp4") &&
                    !product.image.includes(".mov") &&
                    !product.image.includes(".avi")
                      ? product.image
                      : "/placeholder.jpg"
                  }
                  alt={product.title}
                  className="w-full h-full"
                  aspectRatio="3/4"
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  controls={false}
                  showPlayButton={false}
                  priority={true}
                  quality={95}
                  onVideoError={() => {
                    console.warn(
                      "Video failed to load for spotlight/brand:",
                      brand?.name
                    );
                  }}
                />
              ) : (
                <AuthImage
                  src={productImages[selectedImage] || product.image}
                  alt={product.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  aspectRatio="portrait"
                />
              )}
            </div>

            {(productImages.length > 0 ||
              product.video_url ||
              spotlightVideo?.url) && (
              <div className="flex gap-2 overflow-x-auto">
                {product.video_url && (
                  <button
                    onClick={() => setSelectedImage(-1)}
                    className={cn(
                      "flex-shrink-0 w-20 h-28 rounded-md overflow-hidden border-2 relative",
                      selectedImage === -1
                        ? "border-oma-plum ring-2 ring-oma-plum/20"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <AuthImage
                      src={product.video_thumbnail || product.image}
                      alt={`${product.title} video`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      aspectRatio="portrait"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1" />
                      </div>
                    </div>
                    {selectedImage === -1 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-oma-plum rounded-full"></div>
                    )}
                  </button>
                )}
                {spotlightVideo?.url && (
                  <button
                    onClick={() => setSelectedImage(-2)}
                    className={cn(
                      "flex-shrink-0 w-20 h-28 rounded-md overflow-hidden border-2 relative",
                      selectedImage === -2
                        ? "border-oma-plum ring-2 ring-oma-plum/20"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <AuthImage
                      src={safeSrc}
                      alt={
                        product?.title
                          ? `${product.title} brand video`
                          : "Brand video"
                      }
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      aspectRatio="portrait"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1" />
                      </div>
                    </div>
                    {selectedImage === -2 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-oma-plum rounded-full"></div>
                    )}
                  </button>
                )}
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "flex-shrink-0 w-20 h-28 rounded-md overflow-hidden border-2",
                      selectedImage === index
                        ? "border-oma-plum ring-2 ring-oma-plum/20"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                  >
                    <AuthImage
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      aspectRatio="portrait"
                    />
                    {selectedImage === index && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-oma-plum rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Brand Info */}
            <div className="flex items-center gap-3">
              <NavigationLink href={`/brand/${brand.id}`}>
                <div className="flex items-center gap-2 hover:text-oma-plum transition-colors">
                  <span className="font-medium">{brand.name}</span>
                  {brand.is_verified && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </NavigationLink>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                {brand.location}
              </div>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-3xl font-canela text-gray-900 mb-2">
                {product.title}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {product.service_type === "portfolio" ? (
                    <div></div>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-oma-plum">
                        {formatProductPrice(product, brand).displayPrice}
                      </span>
                      {product.sale_price && (
                        <span className="text-lg text-gray-500 line-through">
                          {formatProductPrice(product, brand).originalPrice}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {product.service_type !== "portfolio" && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      product.in_stock
                        ? "bg-oma-gold text-oma-cocoa hover:bg-oma-gold/90 hover:text-oma-cocoa"
                        : "bg-oma-cocoa/40 text-white hover:bg-oma-cocoa/50"
                    )}
                  >
                    {product.in_stock ? "In Stock" : "Out of Stock"}
                  </Badge>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <div className="prose text-oma-black max-w-none">
                  {product.description.split("\n\n").map((paragraph, i) => (
                    <p key={i} className="mb-4 text-gray-600 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Product Attributes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Category</h4>
                  <Badge variant="outline">{product.category}</Badge>
                </div>

                {product.materials && product.materials.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Materials
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {product.materials.map((material, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Available Sizes
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {product.sizes.map((size, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-medium text-oma-cocoa">
                    Available Colours
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.colors?.map((color, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-oma-plum text-oma-plum"
                      >
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Tailored Info */}
              {product.is_custom && (
                <div className="bg-oma-beige/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="h-5 w-5 text-oma-plum" />
                    <h4 className="font-semibold text-gray-900">
                      Custom Tailored Available
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    This piece can be custom tailored to your exact
                    measurements.
                  </p>
                  {product.lead_time && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Lead time: {product.lead_time}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Care Instructions */}
              {product.care_instructions && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Care Instructions
                  </h4>
                  <p className="text-sm text-gray-600">
                    {product.care_instructions}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {product.is_custom ? (
                <Button
                  onClick={handleOrderClick}
                  disabled={!product.in_stock}
                  className="w-full bg-oma-plum hover:bg-oma-plum/90 text-white py-3"
                  size="lg"
                >
                  <Ruler className="h-5 w-5 mr-2" />
                  Order Custom Piece
                </Button>
              ) : (
                <AddToBasketButton
                  productId={product.id}
                  productName={product.title}
                  productImage={product.image}
                  price={product.sale_price || product.price}
                  brandId={product.brand_id}
                  brandName={brand.name}
                  className="w-full py-3"
                />
              )}

              <FavouriteButton
                itemId={product.id}
                itemType="product"
                className="w-full"
              />
              

            </div>

            {/* Brand Rating */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Brand Rating:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{brand.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tailored Order Modal */}
      {showOrderModal && product && brand && (
        <TailoredOrderModal
          product={product}
          brand={brand}
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </div>
  );
}
