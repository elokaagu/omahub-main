"use client";

import { useState } from "react";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useFavourites from "@/lib/hooks/useFavourites";
import { useAuth } from "@/contexts/AuthContext";

interface FavouriteButtonProps {
  itemId: string;
  itemType: "brand" | "catalogue" | "product";
  className?: string;
}

export function FavouriteButton({
  itemId,
  itemType,
  className = "",
}: FavouriteButtonProps) {
  
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isFavourite, toggleFavourite } = useFavourites();
  const { user } = useAuth();

  // Don't render the button if user is not signed in
  if (!user) {
    return null;
  }

  const isFavourited = isFavourite(itemId, itemType);

  const handleToggleFavourite = async () => {
    try {
      setIsLoading(true);
      const wasFavourited = isFavourited; // Capture current state before toggle
      const success = await toggleFavourite(itemId, itemType);

      // Show appropriate feedback based on the action that was performed
      if (!wasFavourited) {
        // We just attempted to add to favourites
        if (success) {
          // Successfully added
          setShowModal(true);
          // Don't show toast when showing modal - modal is more prominent
        } else {
          // Failed to add (e.g., already in favourites)
          toast({
            title: "Already in favourites",
            description: "This item is already in your favourites.",
            variant: "default",
          });
        }
      } else {
        // We just removed from favourites
        toast({
          title: "Removed from favourites",
          description: "Item has been removed from your favourites.",
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

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 150);
  };

  return (
    <>
      <Button
        variant={isFavourited ? "default" : "outline"}
        onClick={handleToggleFavourite}
        disabled={isLoading}
        className={`flex items-center gap-2 ${isFavourited ? "bg-oma-plum text-white hover:bg-oma-plum/90" : "border-oma-plum text-oma-plum hover:bg-oma-plum/10"} ${className}`}
        aria-label={
          isFavourited ? "Remove from favourites" : "Add to favourites"
        }
      >
        <Heart
          className={`h-5 w-5 ${isFavourited ? "fill-current" : ""}`}
          fill={isFavourited ? "currentColor" : "none"}
        />
        <span>{isFavourited ? "Favourited" : "Add to Favourites"}</span>
      </Button>
      {/* Modal Popup */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleCloseModal}
        >
          <div 
            className={`bg-white rounded-lg shadow-lg p-8 max-w-sm w-full relative transition-all duration-200 ${
              isClosing 
                ? 'animate-out fade-out-0 zoom-out-95' 
                : 'animate-in fade-in-0 zoom-in-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <Heart
                className="h-10 w-10 text-oma-plum mb-4 animate-bounce"
                fill="currentColor"
              />
              <h2 className="text-xl font-semibold mb-2 text-oma-plum">
                Added to Favourites!
              </h2>
              <p className="text-gray-700 mb-4">
                This item has been added to your favourites. You can view all
                your favourites from your account menu.
              </p>
              <Button
                onClick={handleCloseModal}
                className="bg-oma-plum text-white hover:bg-oma-plum/90 w-full transition-colors"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
