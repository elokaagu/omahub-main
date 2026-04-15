"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { FavouritesProvider } from "@/contexts/FavouritesContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import type { ServerAuthHydration } from "@/lib/auth/getServerAuthHydration";
import LayoutContent from "./LayoutContent";

interface RootLayoutClientProps {
  children: React.ReactNode;
  initialAuth?: ServerAuthHydration | null;
}

export default function RootLayoutClient({
  children,
  initialAuth = null,
}: RootLayoutClientProps) {
  return (
    <ErrorBoundary>
      <AuthProvider initialAuth={initialAuth}>
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
