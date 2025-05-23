"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/context/AuthContext";

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <AuthProvider>
      <Header />
      <main className={isHomePage ? "" : "pt-20"}>{children}</main>
      <Footer />
    </AuthProvider>
  );
}
