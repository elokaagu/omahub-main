"use client";

import { useState, useEffect } from "react";
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
  const [modalType, setModalType] = useState<"add" | "remove">("add");
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

  // Debug logging to see state changes
  console.log("🔍 FavouriteButton render:", { itemId, itemType, isFavourited });

  // Force re-render when favourites state changes
  useEffect(() => {
    console.log("🔄 FavouriteButton useEffect - favourites state changed:", { itemId, itemType, isFavourited });
  }, [isFavourited, itemId, itemType]);

  const handleToggleFavourite = async () => {
    try {
      setIsLoading(true);
      const wasFavourited = isFavourited; // Capture current state before toggle
      console.log("🔄 Starting toggle:", { wasFavourited, itemId, itemType });
      
      const success = await toggleFavourite(itemId, itemType);
      console.log("✅ Toggle completed:", { success, wasFavourited });

      // Show appropriate feedback based on the action that was performed
      if (!wasFavourited) {
        // We just attempted to add to favourites
        if (success) {
          // Successfully added
          console.log("🎉 Showing add success modal");
          setModalType("add");
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
        if (success) {
          // Successfully removed
          console.log("🎉 Showing remove success modal");
          setModalType("remove");
          setShowModal(true);
          // Don't show toast when showing modal - modal is more prominent
        } else {
          // Failed to remove
          toast({
            title: "Error",
            description: "Failed to remove from favourites. Please try again.",
            variant: "destructive",
          });
        }
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
                className={`h-10 w-10 mb-4 animate-bounce ${
                  modalType === "add" ? "text-oma-plum fill-current" : "text-red-500"
                }`}
                fill={modalType === "add" ? "currentColor" : "none"}
              />
              <h2 className="text-xl font-semibold mb-2 text-oma-plum">
                {modalType === "add" ? "Added to Favourites!" : "Removed from Favourites!"}
              </h2>
              <p className="text-gray-700 mb-4">
                {modalType === "add" 
                  ? "This item has been added to your favourites. You can view all your favourites from your account menu."
                  : "This item has been removed from your favourites."
                }
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
