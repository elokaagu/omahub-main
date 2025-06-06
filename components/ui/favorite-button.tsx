import { useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import useFavorites from "@/lib/hooks/useFavorites";

interface FavoriteButtonProps {
  brandId: string;
  className?: string;
}

const FavoriteButton = ({ brandId, className = "" }: FavoriteButtonProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isProcessing, setIsProcessing] = useState(false);

  const isFavorited = isFavorite(brandId);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save favourites",
        variant: "destructive",
      });
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    const result = await toggleFavorite(brandId);
    setIsProcessing(false);

    if (!result.success) {
      toast({
        title: "Error",
        description: result.message || "Failed to update favourites",
        variant: "destructive",
      });
    } else {
      toast({
        title: isFavorited ? "Removed from favourites" : "Added to favourites",
        description: isFavorited
          ? "The designer has been removed from your favourites"
          : "The designer has been added to your favourites",
      });
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isProcessing}
      className={`relative p-2 rounded-full transition-colors ${
        isFavorited
          ? "text-red-500 hover:text-red-600"
          : "text-gray-400 hover:text-red-500"
      } ${className}`}
      aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
    >
      {isFavorited ? (
        <HeartSolidIcon className="w-5 h-5" />
      ) : (
        <HeartIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export default FavoriteButton;
