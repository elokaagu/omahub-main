"use client";

import { useBasket } from "@/contexts/BasketContext";
import { ShoppingBag } from "lucide-react";

export default function BasketItemCount() {
  const { getTotalItems } = useBasket();
  const totalItems = getTotalItems();

  if (totalItems === 0) {
    return (
      <div className="relative">
        <ShoppingBag className="h-6 w-6 text-gray-600 hover:text-gray-800 transition-colors" />
      </div>
    );
  }

  return (
    <div className="relative">
      <ShoppingBag className="h-6 w-6 text-gray-600 hover:text-gray-800 transition-colors" />
      <span className="absolute -top-2 -right-2 bg-oma-plum text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
        {totalItems > 99 ? "99+" : totalItems}
      </span>
    </div>
  );
}
