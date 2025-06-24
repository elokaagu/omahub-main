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
import { PageFade } from "@/app/components/ui/animations";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { LoadingPage } from "@/components/ui/loading";
import { AuthDebug } from "@/lib/utils/debug";

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

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading: authLoading } = useAuth();
  const { isNavigating, forceReset } = useNavigation();
  const isHomePage = pathname === "/";
  const isStudioPage = pathname?.startsWith("/studio") || false;

  // Emergency reset for stuck navigation states
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow users to force reset with Escape key
      if (e.key === "Escape" && isNavigating) {
        console.log("🔄 Emergency navigation reset triggered by Escape key");
        forceReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNavigating, forceReset]);

  // Show loading spinner for auth loading or navigation loading
  if (authLoading || isNavigating) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {!isStudioPage && <Header />}
      <main className={isHomePage || isStudioPage ? "" : "pt-20"}>
        <AnimatePresence mode="wait">
          <PageFade key={pathname}>{children}</PageFade>
        </AnimatePresence>
      </main>
      {!isStudioPage && <Footer />}
      <Toaster />
    </>
  );
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <AuthProvider>
      <NavigationProvider>
        <LayoutContent>{children}</LayoutContent>
      </NavigationProvider>
    </AuthProvider>
  );
}
