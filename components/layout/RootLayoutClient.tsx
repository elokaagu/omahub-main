"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider, useAuth } from "@/lib/context/AuthContext";
import { PageFade } from "@/app/components/ui/animations";
import { AnimatePresence } from "framer-motion";

interface RootLayoutClientProps {
  children: React.ReactNode;
}

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-oma-plum border-t-transparent rounded-full"></div>
    </div>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useAuth();
  const isHomePage = pathname === "/";
  const isStudioPage = pathname?.startsWith("/studio") || false;

  if (loading) {
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
    </>
  );
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}
