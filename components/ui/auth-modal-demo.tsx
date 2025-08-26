"use client";

import { Button } from "@/components/ui/button";
import { useAuthModalContext } from "@/contexts/AuthModalContext";
import { ShoppingBag, Heart, User, Lock } from "lucide-react";

export function AuthModalDemo() {
  const { openAuthModal } = useAuthModalContext();

  const showBasketAuth = () => {
    openAuthModal({
      title: "Sign In to Add to Basket",
      message: "Please sign in to add this item to your basket and continue shopping.",
      showSignUp: true
    });
  };

  const showFavouritesAuth = () => {
    openAuthModal({
      title: "Sign In to Save Favourites",
      message: "Create an account to save your favourite designs and get personalized recommendations.",
      showSignUp: true
    });
  };

  const showCustomOrderAuth = () => {
    openAuthModal({
      title: "Sign In for Custom Orders",
      message: "Please sign in to submit custom order requests and get tailored fashion pieces.",
      showSignUp: true
    });
  };

  const showGeneralAuth = () => {
    openAuthModal({
      title: "Welcome to OmaHub",
      message: "Sign in to access your account, manage orders, and explore exclusive fashion collections.",
      showSignUp: true
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-oma-beige max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-oma-plum mb-6 text-center">
        Custom Authentication Modal Demo
      </h2>
      
      <p className="text-oma-cocoa text-center mb-8">
        This replaces the browser's default alert with a beautiful, integrated OmaHub authentication modal.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={showBasketAuth}
          className="bg-oma-plum hover:bg-oma-plum/90 text-white p-4 h-auto flex-col gap-2"
        >
          <ShoppingBag className="h-6 w-6" />
          <span>Add to Basket</span>
        </Button>

        <Button
          onClick={showFavouritesAuth}
          className="bg-oma-plum hover:bg-oma-plum/90 text-white p-4 h-auto flex-col gap-2"
        >
          <Heart className="h-6 w-6" />
          <span>Save to Favourites</span>
        </Button>

        <Button
          onClick={showCustomOrderAuth}
          className="bg-oma-plum hover:bg-oma-plum/90 text-white p-4 h-auto flex-col gap-2"
        >
          <User className="h-6 w-6" />
          <span>Custom Order</span>
        </Button>

        <Button
          onClick={showGeneralAuth}
          className="bg-oma-plum hover:bg-oma-plum/90 text-white p-4 h-auto flex-col gap-2"
        >
          <Lock className="h-6 w-6" />
          <span>General Access</span>
        </Button>
      </div>

      <div className="mt-8 p-4 bg-oma-cream/20 rounded-lg border border-oma-beige">
        <h3 className="font-semibold text-oma-plum mb-2">Features:</h3>
        <ul className="text-sm text-oma-cocoa space-y-1">
          <li>• Beautiful OmaHub-styled design with your brand colors</li>
          <li>• Seamless sign-in and sign-up forms</li>
          <li>• Toggle between authentication modes</li>
          <li>• Quick action buttons for easy navigation</li>
          <li>• Responsive design that works on all devices</li>
          <li>• Integrated with your existing authentication system</li>
        </ul>
      </div>
    </div>
  );
}
