"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useFavourites from "@/lib/hooks/useFavourites";

interface FavouriteButtonProps {
  itemId: string;
  itemType: "brand" | "catalogue" | "product";
  initialIsFavourited?: boolean;
  className?: string;
}

export function FavouriteButton({
  itemId,
  itemType,
  initialIsFavourited = false,
  className = "",
}: FavouriteButtonProps) {
  const [isFavourited, setIsFavourited] = useState(initialIsFavourited);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addFavourite, removeFavourite } = useFavourites();

  const handleToggleFavourite = async () => {
    try {
      setIsLoading(true);
      if (isFavourited) {
        await removeFavourite(itemId, itemType);
        setIsFavourited(false);
        toast({
          title: "Removed from favourites",
          description: "Item has been removed from your favourites.",
        });
      } else {
        await addFavourite(itemId, itemType);
        setIsFavourited(true);
        toast({
          title: "Added to favourites",
          description: "Item has been added to your favourites.",
        });
      }
    } catch (error) {
      console.error("Error toggling favourite:", error);
      toast({
        title: "Error",
        description: "Failed to update favourites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleFavourite}
      disabled={isLoading}
      className={`hover:bg-oma-plum/10 ${className}`}
      aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
    >
      <Heart
        className={`h-5 w-5 ${
          isFavourited ? "fill-oma-plum text-oma-plum" : "text-oma-cocoa"
        }`}
      />
    </Button>
  );
}
