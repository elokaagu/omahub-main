"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import Header from "./Header";
import Footer from "./Footer";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Toaster } from "sonner";
import { SearchModal } from "@/components/ui/search-modal";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
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
      <main
        className={
          isHomePage || isStudioPage ? "" : "pt-20"
        }
      >
        {children}
      </main>
      {!isStudioPage && <Footer />}
      <Toaster position="top-right" />
      <SearchModal />
    </>
  );
}
