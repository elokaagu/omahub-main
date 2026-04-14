"use client";

import type { Product } from "@/lib/supabase";
import { AuthImage } from "@/components/ui/auth-image";
import { VideoPlayer } from "@/components/ui/video-player";
import { cn } from "@/lib/utils";
import {
  type MediaSelection,
  mediaSelectionEquals,
  imageIndexForSelection,
} from "@/lib/product/productMediaSelection";
import { isImageLikeUrl } from "@/lib/product/mediaUrl";

type SpotlightVideo = { url: string; thumbnail?: string };

interface ProductMediaGalleryProps {
  product: Product;
  productImages: string[];
  spotlightVideo: SpotlightVideo | null;
  selection: MediaSelection;
  onSelect: (next: MediaSelection) => void;
}

function thumbnailSrc(url: string | undefined, fallback: string | undefined) {
  if (url && isImageLikeUrl(url)) return url;
  if (fallback && isImageLikeUrl(fallback)) return fallback;
  return url || fallback || "/placeholder.jpg";
}

export function ProductMediaGallery({
  product,
  productImages,
  spotlightVideo,
  selection,
  onSelect,
}: ProductMediaGalleryProps) {
  const imgIndex = imageIndexForSelection(selection, productImages.length);
  const mainImageSrc =
    productImages[imgIndex] || product.image || "/placeholder.jpg";

  const spotlightThumbSrc =
    (spotlightVideo?.thumbnail && isImageLikeUrl(spotlightVideo.thumbnail)
      ? spotlightVideo.thumbnail
      : undefined) ||
    (product.image && isImageLikeUrl(product.image) ? product.image : "") ||
    "";

  const showProductVideo =
    !!product.video_url && mediaSelectionEquals(selection, { kind: "product_video" });

  const showSpotlightVideo =
    !!spotlightVideo?.url &&
    mediaSelectionEquals(selection, { kind: "spotlight_video" });

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
        {showProductVideo ? (
          <VideoPlayer
            videoUrl={product.video_url!}
            thumbnailUrl={
              product.video_thumbnail &&
              isImageLikeUrl(product.video_thumbnail)
                ? product.video_thumbnail
                : undefined
            }
            fallbackImageUrl={
              product.image && isImageLikeUrl(product.image)
                ? product.image
                : "/placeholder.jpg"
            }
            alt={product.title}
            className="h-full w-full"
            aspectRatio="3/4"
            autoPlay
            muted
            loop
            controls={false}
            showPlayButton={false}
            priority
            quality={95}
            onVideoError={() => {}}
          />
        ) : showSpotlightVideo ? (
          <VideoPlayer
            videoUrl={spotlightVideo!.url}
            thumbnailUrl={
              spotlightVideo!.thumbnail &&
              isImageLikeUrl(spotlightVideo!.thumbnail)
                ? spotlightVideo!.thumbnail
                : undefined
            }
            fallbackImageUrl={
              product.image && isImageLikeUrl(product.image)
                ? product.image
                : "/placeholder.jpg"
            }
            alt={product.title}
            className="h-full w-full"
            aspectRatio="3/4"
            autoPlay
            muted
            loop
            controls={false}
            showPlayButton={false}
            priority
            quality={95}
            onVideoError={() => {}}
          />
        ) : (
          <AuthImage
            src={mainImageSrc}
            alt={product.title}
            width={600}
            height={600}
            className="h-full w-full object-cover"
            aspectRatio="portrait"
          />
        )}
      </div>

      {(productImages.length > 0 || product.video_url || spotlightVideo?.url) && (
        <div className="flex gap-2 overflow-x-auto">
          {product.video_url && (
            <button
              type="button"
              onClick={() => onSelect({ kind: "product_video" })}
              className={cn(
                "relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-md border-2",
                mediaSelectionEquals(selection, { kind: "product_video" })
                  ? "border-oma-plum ring-2 ring-oma-plum/20"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <AuthImage
                src={thumbnailSrc(product.video_thumbnail, product.image)}
                alt={`${product.title} video`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                aspectRatio="portrait"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <div className="ml-1 h-0 w-0 border-b-[4px] border-l-[6px] border-t-[4px] border-b-transparent border-l-black border-t-transparent" />
                </div>
              </div>
              {mediaSelectionEquals(selection, { kind: "product_video" }) && (
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-oma-plum" />
              )}
            </button>
          )}

          {spotlightVideo?.url && (
            <button
              type="button"
              onClick={() => onSelect({ kind: "spotlight_video" })}
              className={cn(
                "relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-md border-2",
                mediaSelectionEquals(selection, { kind: "spotlight_video" })
                  ? "border-oma-plum ring-2 ring-oma-plum/20"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <AuthImage
                src={spotlightThumbSrc || "/placeholder.jpg"}
                alt={`${product.title} brand video`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                aspectRatio="portrait"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <div className="ml-1 h-0 w-0 border-b-[4px] border-l-[6px] border-t-[4px] border-b-transparent border-l-black border-t-transparent" />
                </div>
              </div>
              {mediaSelectionEquals(selection, { kind: "spotlight_video" }) && (
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-oma-plum" />
              )}
            </button>
          )}

          {productImages.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              onClick={() => onSelect({ kind: "image", index })}
              className={cn(
                "relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-md border-2",
                mediaSelectionEquals(selection, { kind: "image", index })
                  ? "border-oma-plum ring-2 ring-oma-plum/20"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <AuthImage
                src={image}
                alt={`${product.title} ${index + 1}`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                aspectRatio="portrait"
              />
              {mediaSelectionEquals(selection, { kind: "image", index }) && (
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-oma-plum" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
