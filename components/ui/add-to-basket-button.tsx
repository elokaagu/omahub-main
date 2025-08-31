"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModalContext } from "@/contexts/AuthModalContext";
import { MessageSquare, User } from "lucide-react";
import { BrandRequestModal } from "./brand-request-modal";

interface AddToBasketButtonProps {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  brandId: string;
  brandName: string;
  brandCurrency?: string;
  sizes?: string[];
  colors?: string[];
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  disabled?: boolean;
}

export default function AddToBasketButton({
  productId,
  productName,
  productImage,
  price,
  brandId,
  brandName,
  brandCurrency,
  sizes,
  colors,
  className,
  variant = "default",
  disabled = false,
}: AddToBasketButtonProps) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModalContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If user is not authenticated, show sign-in modal
  if (!user) {
    return (
      <Button
        onClick={() =>
          openAuthModal({
            title: "Sign In to Request from Brand",
            message: `Please sign in to submit your request for ${productName} to ${brandName}.`,
            showSignUp: true,
          })
        }
        className={`bg-oma-plum hover:bg-oma-plum/90 text-white ${className}`}
      >
        <User className="h-4 w-4 mr-2" />
        Sign In to Request
      </Button>
    );
  }

  const handleRequestClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleRequestClick}
        disabled={disabled}
        className={`bg-oma-plum hover:bg-oma-plum/90 text-white ${className}`}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Request from {brandName}
      </Button>

      <BrandRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        productName={productName}
        productImage={productImage}
        price={price}
        brandId={brandId}
        brandName={brandName}
        brandCurrency={brandCurrency}
        sizes={sizes}
        colors={colors}
      />
    </>
  );
}
