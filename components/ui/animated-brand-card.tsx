"use client";

import { NavigationLink } from "./navigation-link";
import Image from "next/image";
import { CheckCircle } from "@/components/ui/icons";

interface AnimatedBrandCardProps {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  rating?: number;
  isVerified?: boolean;
  isPortrait?: boolean;
}

export function AnimatedBrandCard({
  id,
  name,
  image,
  category,
  location,
  rating = 4.5,
  isVerified = false,
  isPortrait = false,
}: AnimatedBrandCardProps) {
  return (
    <NavigationLink
      href={`/brand/${id}`}
      className={`group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        isPortrait ? "flex items-center" : ""
      }`}
    >
      <div className={`${isPortrait ? "w-1/3 h-40" : "aspect-[4/5]"} relative`}>
        <Image
          src={image || "/placeholder-image.jpg"}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className={`p-6 ${isPortrait ? "w-2/3" : ""}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          {isVerified && <CheckCircle className="h-5 w-5 text-oma-plum" />}
        </div>
        <div className="flex items-center gap-2 text-sm text-oma-cocoa">
          <span className="px-2 py-1 bg-oma-beige/50 rounded">{category}</span>
          <span>•</span>
          <span>{location}</span>
          <span>•</span>
          <span>★ {rating}</span>
        </div>
      </div>
    </NavigationLink>
  );
}
