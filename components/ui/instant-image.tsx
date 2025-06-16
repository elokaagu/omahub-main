import Image from "next/image";
import { cn } from "@/lib/utils";

interface InstantImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | string;
  quality?: number;
  sizes?: string;
  fill?: boolean;
}

export function InstantImage({
  src,
  alt,
  width = 500,
  height = 500,
  className = "",
  aspectRatio,
  quality = 85,
  sizes,
  fill = false,
}: InstantImageProps) {
  // Get aspect ratio classes
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "video":
        return "aspect-video";
      case "portrait":
        return "aspect-[3/4]";
      case "landscape":
        return "aspect-[4/3]";
      default:
        return aspectRatio ? `aspect-[${aspectRatio}]` : "";
    }
  };

  const containerClasses = cn(
    "relative overflow-hidden",
    getAspectRatioClass(),
    className
  );

  return (
    <div className={containerClasses}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={fill ? "object-cover" : "w-full h-full object-cover"}
        priority={true}
        quality={quality}
        sizes={sizes}
        loading="eager"
      />
    </div>
  );
}
