"use client";

import { useBasket } from "@/contexts/BasketContext";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, User } from "lucide-react";
import Link from "next/link";

export default function BasketItemCount() {
  const { user } = useAuth();
  const { getTotalItems } = useBasket();
  
  // If user is not authenticated, show sign-in icon
  if (!user) {
    return (
      <Link href="/login" className="relative">
        <User className="h-6 w-6 text-gray-600 hover:text-gray-800 transition-colors" />
      </Link>
    );
  }

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
