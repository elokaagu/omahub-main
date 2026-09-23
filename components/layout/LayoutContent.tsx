"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import Header from "./Header";
import Footer from "./Footer";
import { NavigationProgressBar } from "@/components/ui/navigation-progress-bar";
import { SearchDialog } from "@/components/search/SearchDialog";
import { PageTransition } from "@/components/ui/page-transition";

export default function LayoutContent({
  children,
  instagramFeed = null,
}: {
  children: React.ReactNode;
  instagramFeed?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isNavigating, forceReset } = useNavigation();
  const isHomePage = pathname === "/";
  const isStudioPage = pathname?.startsWith("/studio") || false;
  // These open on a full-bleed photograph with the header floating over it.
  const isPhotoHeroPage =
    /^\/brand\/[^/]+$/.test(pathname ?? "") ||
    /^\/editions\/[^/]+$/.test(pathname ?? "");
  const hideHeader = isStudioPage;

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

  return (
    <>
      <NavigationProgressBar visible={isNavigating} />
      {!hideHeader && <Header />}
      <main
        className={
          isHomePage || hideHeader || isPhotoHeroPage
            ? ""
            : "pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))]"
        }
      >
        {isStudioPage ? (
          children
        ) : (
          <PageTransition routeKey={pathname ?? ""} variant="marketing">
            {children}
          </PageTransition>
        )}
      </main>
      {!isStudioPage && instagramFeed}
      {!isStudioPage && <Footer />}
      <SearchDialog />
    </>
  );
}
