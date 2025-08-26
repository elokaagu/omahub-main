"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBasket } from "@/contexts/BasketContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModalContext } from "@/contexts/AuthModalContext";
import { ShoppingBag, Loader2, User, MessageSquare } from "lucide-react";
import { BrandRequestModal } from "./brand-request-modal";
import { toast } from "sonner";

interface AddToBasketButtonProps {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  brandId: string;
  brandName: string;
  size?: string;
  color?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  disabled?: boolean;
}

export default function AddToBasketButton({
  productId,
  productName,
  productImage,
  price,
  brandId,
  brandName,
  size,
  color,
  className,
  variant = "default",
  disabled = false,
}: AddToBasketButtonProps) {
  
  const { user } = useAuth();
  const { addToBasket, state } = useBasket();
  const { openAuthModal } = useAuthModalContext();
  const [isAdding, setIsAdding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If user is not authenticated, show sign-in modal
  if (!user) {
    return (
      <Button 
        onClick={() => openAuthModal({
          title: "Sign In to Continue",
          message: `Please sign in to add "${productName}" to your basket or submit a request to ${brandName}.`,
          showSignUp: true
        })}
        className={`bg-oma-plum hover:bg-oma-plum/90 text-white ${className}`}
      >
        <User className="h-4 w-4 mr-2" />
        Sign In to Continue
      </Button>
    );
  }

  const handleAddToBasket = async () => {
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      await addToBasket(productId, 1, size, color);
      toast.success(`${productName} added to basket!`);
    } catch (error) {
      toast.error("Failed to add to basket. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRequestClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-3">
        <Button
          onClick={handleAddToBasket}
          disabled={isAdding || state.isLoading}
          className={`bg-oma-plum hover:bg-oma-plum/90 text-white ${className}`}
        >
          {isAdding || state.isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShoppingBag className="h-4 w-4 mr-2" />
          )}
          {isAdding || state.isLoading ? "Adding..." : "Add to Basket"}
        </Button>

        <Button
          onClick={handleRequestClick}
          variant="outline"
          disabled={disabled}
          className={`border-oma-plum text-oma-plum hover:bg-oma-plum/10 ${className}`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Request from {brandName}
        </Button>
      </div>

      <BrandRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        productName={productName}
        productImage={productImage}
        price={price}
        brandId={brandId}
        brandName={brandName}
        size={size}
        color={color}
      />
    </>
  );
}
