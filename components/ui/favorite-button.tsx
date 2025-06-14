"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useFavourites from "@/lib/hooks/useFavourites";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  const handleToggleFavourite = async () => {
    try {
      setIsLoading(true);
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save favourites",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      if (isFavourited) {
        await removeFavourite(user.id, itemId);
        setIsFavourited(false);
        toast({
          title: "Removed from favourites",
          description: "Item has been removed from your favourites.",
        });
      } else {
        await addFavourite(user.id, itemId);
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
