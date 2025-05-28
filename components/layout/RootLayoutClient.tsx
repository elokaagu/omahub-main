"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/context/AuthContext";
import { PageFade } from "@/components/ui/animations";
import { AnimatePresence } from "framer-motion";

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isStudioPage = pathname.startsWith("/studio");

  return (
    <AuthProvider>
      {!isStudioPage && <Header />}
      <main className={isHomePage || isStudioPage ? "" : "pt-20"}>
        <AnimatePresence mode="wait">
          <PageFade key={pathname}>{children}</PageFade>
        </AnimatePresence>
      </main>
      {!isStudioPage && <Footer />}
    </AuthProvider>
  );
}
