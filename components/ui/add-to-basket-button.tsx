"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBasket } from "@/contexts/BasketContext";
import { ShoppingBag, Loader2 } from "lucide-react";

interface AddToBasketButtonProps {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  size?: string;
  colour?: string;
  className?: string;
}

export default function AddToBasketButton({
  productId,
  productName,
  productImage,
  price,
  size,
  colour,
  className = "",
}: AddToBasketButtonProps) {
  const { addToBasket, state } = useBasket();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToBasket = async () => {
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      await addToBasket(productId, 1, size, colour);
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
