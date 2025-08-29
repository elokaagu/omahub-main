"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  NavigationProvider,
  useNavigation,
} from "@/contexts/NavigationContext";
import { FavouritesProvider } from "@/contexts/FavouritesContext";
import { PageFade } from "@/app/components/ui/animations";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { LoadingPage } from "@/components/ui/loading";
import { AuthDebug } from "@/lib/utils/debug";
import { SearchModal } from "@/components/ui/search-modal";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import LayoutContent from "./LayoutContent";

interface RootLayoutClientProps {
  children: React.ReactNode;
}

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-oma-cocoa">Loading...</p>
      </div>
    </div>
  );
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationProvider>
          <FavouritesProvider>
            <AuthModalProvider>
              <LayoutContent>{children}</LayoutContent>
            </AuthModalProvider>
          </FavouritesProvider>
        </NavigationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
