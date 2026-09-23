import { LazyImage } from "./lazy-image";
import { IMAGE_QUALITY, type FocalPoint } from "@/lib/images/imageSizing";

interface AuthImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | string;
  quality?: number;
  sizes?: string;
  /** Where the crop holds - see FOCAL_POINTS. */
  focal?: FocalPoint | string;
  fill?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function AuthImage({
  src,
  alt,
  width = 500,
  height = 500,
  className = "",
  priority = false,
  aspectRatio,
  quality = IMAGE_QUALITY.standard,
  sizes,
  focal,
  fill = false,
  isUploading = false,
  uploadProgress = 0,
}: AuthImageProps) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      aspectRatio={aspectRatio}
      quality={quality}
      sizes={sizes}
      focal={focal}
      fill={fill}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
    />
  );
}
