"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBasket } from "@/contexts/BasketContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModalContext } from "@/contexts/AuthModalContext";
import { ShoppingBag, Loader2, User } from "lucide-react";
import Link from "next/link";

interface AddToBasketButtonProps {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
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

  // If user is not authenticated, show sign-in modal
  if (!user) {
    return (
      <Button 
        onClick={() => openAuthModal({
          title: "Sign In to Add to Basket",
          message: `Please sign in to add "${productName}" to your basket.`,
          showSignUp: true
        })}
        className={`bg-oma-plum hover:bg-oma-plum/90 text-white ${className}`}
      >
        <User className="h-4 w-4 mr-2" />
        Sign In to Add to Basket
      </Button>
    );
  }

  const handleAddToBasket = async () => {
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      await addToBasket(productId, 1, size, color);
    } finally {
      setIsAdding(false);
    }
  };

  return (
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
  );
}
