"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFavourites from "@/lib/hooks/useFavourites";
import { useAuth } from "@/contexts/AuthContext";

interface FavouriteButtonProps {
  itemId: string;
  itemType: "brand" | "catalogue" | "product";
  className?: string;
  showText?: boolean;
}

export function FavouriteButton({
  itemId,
  itemType,
  className = "",
  showText = true,
}: FavouriteButtonProps) {
  const { user } = useAuth();
  const { isFavourite, toggleFavourite, loading } = useFavourites();
  const [isToggling, setIsToggling] = useState(false);

  // Don't render if user is not signed in
  if (!user) {
    return null;
  }

  const isFavourited = isFavourite(itemId, itemType);
  const isLoading = loading || isToggling;

  const handleToggle = async () => {
    if (isLoading) return;

    try {
      setIsToggling(true);
      const success = await toggleFavourite(itemId, itemType);
      
      if (success) {
        if (isFavourited) {
          toast.success("Removed from favourites");
        } else {
          toast.success("Added to favourites");
        }
      }
    } catch (error) {
      console.error("Error toggling favourite:", error);
      toast.error("Failed to update favourites");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Button
      variant={isFavourited ? "default" : "outline"}
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        flex items-center gap-2 transition-all duration-200
        ${isFavourited 
          ? "bg-oma-plum text-white hover:bg-oma-plum/90" 
          : "border-oma-plum text-oma-plum hover:bg-oma-plum/10"
        }
        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      aria-label={
        isFavourited ? "Remove from favourites" : "Add to favourites"
      }
    >
      <Heart
        className={`h-5 w-5 transition-all duration-200 ${
          isFavourited ? "fill-current scale-110" : ""
        }`}
        fill={isFavourited ? "currentColor" : "none"}
      />
      {showText && (
        <span className="font-medium">
          {isFavourited ? "Favourited" : "Add to Favourites"}
        </span>
      )}
    </Button>
  );
}
