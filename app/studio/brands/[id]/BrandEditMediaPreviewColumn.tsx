import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { VideoUpload } from "@/components/ui/video-upload";
import { VideoPlayer } from "@/components/ui/video-player";
import { AuthImage } from "@/components/ui/auth-image";
import { Globe, MapPin, Star, CheckCircle } from "lucide-react";
import { formatPriceRange } from "@/lib/utils/priceFormatter";
import type { BrandEditorApi } from "./useBrandEditor";

export function BrandEditMediaPreviewColumn({
  editor,
}: {
  editor: BrandEditorApi;
}) {
  const {
    brand,
    imageUrl,
    imageUploading,
    imageUploadProgress,
    handleImageUpload,
    handleImageUploadStart,
    handleImageUploadProgress,
    setBrand,
    priceMin,
    priceMax,
    currency,
    STUDIO_CURRENCIES,
  } = editor;

  if (!brand) return null;

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Brand Image</CardTitle>
          <CardDescription>
            Upload an image to represent this brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            onUploadComplete={handleImageUpload}
            onUploadStart={handleImageUploadStart}
            onUploadProgress={handleImageUploadProgress}
            defaultValue={imageUrl}
            bucket="brand-assets"
            path="brands"
          />
          {process.env.NODE_ENV === "development" && (
            <div className="mt-2 text-xs text-gray-500">
              Debug: imageUrl = {imageUrl || "empty"}
              <br />
              brand.brand_images = {brand.brand_images?.length || 0} items
              <br />
              storage_path = {brand.brand_images?.[0]?.storage_path || "none"}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Brand Video (optional)</CardTitle>
          <CardDescription>
            Upload a video to showcase your brand (MP4, WebM, QuickTime, max
            50MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoUpload
            onUploadComplete={(url) => {
              setBrand({ ...brand, video_url: url });
            }}
            defaultValue={brand.video_url}
            bucket="product-videos"
            path="brands"
            accept="video/mp4,video/webm,video/quicktime"
            maxSize={50}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Brand Preview</CardTitle>
          <CardDescription>
            See how this brand appears on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="h-36 bg-gray-100 relative">
              {brand.video_url ? (
                <VideoPlayer
                  videoUrl={brand.video_url}
                  thumbnailUrl={brand.video_thumbnail}
                  fallbackImageUrl={imageUrl}
                  alt={brand.name}
                  aspectRatio="16/9"
                  className="w-full h-full"
                  sizes="800px"
                  quality={85}
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  controls={false}
                  showPlayButton={false}
                />
              ) : imageUrl ? (
                <AuthImage
                  src={imageUrl}
                  alt={brand.name}
                  aspectRatio="16/9"
                  className="w-full h-full"
                  sizes="800px"
                  quality={85}
                  isUploading={imageUploading}
                  uploadProgress={imageUploadProgress}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No image
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{brand.name}</h3>
                {brand.is_verified && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Globe className="h-3 w-3 mr-1" />
                <span>{brand.category}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{brand.location}</span>
              </div>
              {(priceMin && priceMax && currency) || brand.price_range ? (
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span className="font-medium">Price Range:</span>
                  <span className="ml-1">
                    {priceMin && priceMax && currency
                      ? formatPriceRange(
                          priceMin,
                          priceMax,
                          STUDIO_CURRENCIES.find((c) => c.code === currency)
                            ?.symbol || "$"
                        )
                      : brand.price_range}
                  </span>
                </div>
              ) : null}
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {brand.description || ""}
              </p>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                {brand.rating && brand.rating > 0 ? (
                  brand.rating.toFixed(1)
                ) : (
                  <span className="text-gray-400">No ratings yet</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/brand/${brand.id}`} target="_blank">
              View on Site
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
