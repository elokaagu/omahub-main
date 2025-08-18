"use client";

import { useBasket } from "@/contexts/BasketContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function BasketPage() {
  const { state, removeFromBasket, updateQuantity, getTotalPrice } = useBasket();
  const { baskets, isLoading, error } = state;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your basket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Error loading basket
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const totalItems = baskets.reduce((sum, basket) => sum + basket.totalItems, 0);
  const totalPrice = getTotalPrice();

  if (totalItems === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">
            <ShoppingBag className="mx-auto h-16 w-16" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Your basket is empty
          </h1>
          <p className="text-gray-600 mb-6">
            Start shopping to add items to your basket
          </p>
          <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
            <Link href="/directory">Explore Brands</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Your Basket</h1>
            <p className="text-gray-600">
              {totalItems} item{totalItems !== 1 ? "s" : ""} • Total: £{totalPrice.toFixed(2)}
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {baskets.map((basket) =>
              basket.items.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {item.productName}
                    </h3>
                    <p className="text-gray-500">
                      £{item.price.toFixed(2)}
                      {item.size && ` • Size: ${item.size}`}
                      {item.colour && ` • Colour: ${item.colour}`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateQuantity(item.id, item.quantity - 1);
                        }
                      }}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-gray-900 font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      £{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFromBasket(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900">
                Total: £{totalPrice.toFixed(2)}
              </div>
              <div className="space-x-3">
                <Button variant="outline" asChild>
                  <Link href="/directory">Continue Shopping</Link>
                </Button>
                <Button className="bg-oma-plum hover:bg-oma-plum/90">
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
