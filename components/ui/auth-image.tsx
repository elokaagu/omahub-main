import { useState, useEffect } from "react";
import Image from "next/image";
import { convertToSignedUrl } from "@/lib/services/imageService";

interface AuthImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function AuthImage({
  src,
  alt,
  width = 500,
  height = 500,
  className = "",
  priority = false,
}: AuthImageProps) {
  const [signedUrl, setSignedUrl] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    async function getSignedUrl() {
      try {
        if (src.includes("/storage/v1/object/public/")) {
          const signed = await convertToSignedUrl(src);
          setSignedUrl(signed);
        } else {
          setSignedUrl(src);
        }
      } catch (err) {
        console.error("Error getting signed URL:", err);
        setError(true);
      }
    }

    getSignedUrl();
  }, [src]);

  if (error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
      >
        <span className="text-gray-500">Image not available</span>
      </div>
    );
  }

  if (!signedUrl) {
    return <div className={`bg-gray-100 animate-pulse ${className}`} />;
  }

  return (
    <Image
      src={signedUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
