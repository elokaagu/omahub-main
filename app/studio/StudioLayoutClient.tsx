"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { supabaseHelpers } from "@/lib/utils/supabase-helpers";
import { Button } from "@/components/ui/button";
import { NavigationLink } from "@/components/ui/navigation-link";
import UserProfile from "@/components/auth/UserProfile";
// Phase 2B: Selective icon imports instead of large lucide-react bundle
import {
  Home,
  Package,
  ImageIcon,
  ShoppingBag,
  Scissors,
  Monitor,
  Users,
  MessageSquare,
  Inbox,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Mail,
} from "@/lib/utils/iconImports";
import { TailoringEventProvider } from "@/contexts/NavigationContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { useStudioOptimization } from "@/lib/hooks/useStudioOptimization";
import type { Database } from "@/lib/types/supabase";
import { StudioInitialDataProvider } from "@/contexts/StudioInitialDataContext";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type StudioLayoutClientProps = {
  children: React.ReactNode;
  initialProfile: Profile | null;
  initialUser: {
    id: string;
    email: string | null;
    role?: Profile["role"] | null;
    owned_brands?: string[] | null;
  } | null;
};

// Dynamic imports for heavy Studio pages
const StudioBrandsPage = dynamic(() => import("./brands/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioCollectionsPage = dynamic(() => import("./collections/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioProductsPage = dynamic(() => import("./products/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioServicesPage = dynamic(() => import("./services/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioPortfolioPage = dynamic(() => import("./portfolio/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioHeroPage = dynamic(() => import("./hero/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioSpotlightPage = dynamic(() => import("./spotlight/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioUsersPage = dynamic(() => import("./users/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioReviewsPage = dynamic(() => import("./reviews/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioInboxPage = dynamic(() => import("./inbox/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioProfilePage = dynamic(() => import("./profile/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

const StudioSettingsPage = dynamic(() => import("./settings/page"), {
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />,
  ssr: false,
});

export default function StudioLayoutClient({
  children,
  initialProfile,
  initialUser,
}: StudioLayoutClientProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pendingSidebarClose = useRef(false);
  const [fadeIn, setFadeIn] = useState(false);

  const handleSidebarNav = () => {
    // No-op, just for compatibility
  };

  useEffect(() => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Use optimization hook to prevent constant reloading
  const { debouncedFetch, controlledRefresh, forceRefresh, trackFetch } =
    useStudioOptimization({
      debounceMs: 1000, // 1 second debounce
      maxRefreshIntervalMs: 30000, // 30 seconds max between checks
      enableRealTimeUpdates: true,
    });

  // Add refs to prevent multiple simultaneous access checks
  const isCheckingAccessRef = useRef(false);
  const lastAccessCheckRef = useRef(0);
  const ACCESS_CHECK_DEBOUNCE_MS = 10000; // Increased to 10 seconds debounce

  // Trigger fade-in animation when content is ready
  useEffect(() => {
    if (
      !loading &&
      !isCheckingAccess &&
      permissions.includes("studio.access")
    ) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setFadeIn(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, isCheckingAccess, permissions]);

  useEffect(() => {
    const checkAccess = async () => {
      // Prevent multiple simultaneous access checks
      if (isCheckingAccessRef.current) {
        console.log(
          "⏳ Studio Layout: Access check already in progress, skipping..."
        );
        return;
      }

      // Debounce access checks to prevent excessive calls
      const now = Date.now();
      if (now - lastAccessCheckRef.current < ACCESS_CHECK_DEBOUNCE_MS) {
        console.log("⏳ Studio Layout: Access check debounced, skipping...");
        return;
      }

      try {
        isCheckingAccessRef.current = true;
        lastAccessCheckRef.current = now;

        console.log("🔒 Studio Layout: Access check starting...");
        console.log("Studio Layout: Current auth state:", {
          userId: user?.id,
          userEmail: user?.email,
          isLoading: loading,
        });

        if (loading) {
          console.log("⏳ Studio Layout: Auth is still loading...");
          return;
        }

        if (!user) {
          console.log("❌ Studio Layout: No user found, redirecting to login");
          router.push("/login?redirect=/studio");
          return;
        }

        // Get user permissions with detailed logging
        console.log("🔍 Studio Layout: Getting permissions for user:", user.id);
        console.log("🔍 Studio Layout: User email:", user.email);
        console.log("🔍 Studio Layout: About to call getUserPermissions...");

        const userPermissions = await getUserPermissions(user.id, user.email);

        console.log(
          "👤 Studio Layout: User permissions received:",
          userPermissions
        );
        console.log(
          "👤 Studio Layout: Permissions array length:",
          userPermissions.length
        );
        console.log(
          "👤 Studio Layout: Permissions array contents:",
          JSON.stringify(userPermissions)
        );
        console.log(
          "🔐 Studio Layout: Checking for studio.access permission..."
        );
        console.log(
          "🔐 Studio Layout: Has studio.access?",
          userPermissions.includes("studio.access")
        );

        if (!userPermissions.includes("studio.access")) {
          console.log(
            "⛔ Studio Layout: User does not have studio access, redirecting to home"
          );
          console.log(
            "⛔ Studio Layout: Available permissions:",
            userPermissions
          );
          router.push("/");
          return;
        }

        console.log("✅ Studio Layout: Access granted, setting permissions");
        setPermissions(userPermissions);
      } catch (error) {
        console.error("❌ Studio Layout: Error checking access:", error);
        console.error(
          "❌ Studio Layout: Error stack:",
          (error as Error)?.stack
        );
        router.push("/");
      } finally {
        console.log("🏁 Studio Layout: Setting isCheckingAccess to false");
        setIsCheckingAccess(false);
        isCheckingAccessRef.current = false;
      }
    };

    // Skip access check if already completed and permissions are set
    if (permissions.includes("studio.access") && !isCheckingAccess) {
      console.log("✅ Studio Layout: Access already verified, skipping check");
      return;
    }

    console.log("🚀 Studio Layout: useEffect triggered with:", {
      user: !!user,
      loading,
      isCheckingAccess,
    });
    checkAccess();
  }, [user, loading, permissions, isCheckingAccess]);

  // Enhanced error handling and performance monitoring
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Studio Layout Error:", event.error);
      // Log to analytics service if available
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "exception", {
          description: event.error?.message || "Unknown error",
          fatal: false,
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Studio Layout Unhandled Promise Rejection:", event.reason);
      event.preventDefault();
      // Log to analytics service if available
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "exception", {
          description: event.reason?.message || "Unhandled promise rejection",
          fatal: false,
        });
      }
    };

    // Performance monitoring
    const handleLoad = () => {
      if (typeof window !== "undefined" && window.performance) {
        const navigation = performance.getEntriesByType("navigation")[0] as any;
        if (navigation) {
          console.log("📊 Studio Load Performance:", {
            domContentLoaded:
              navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            total: navigation.loadEventEnd - navigation.navigationStart,
          });
        }
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  const handleBackToSite = () => {
    // Use window.location.href for more reliable navigation
    // This ensures a clean transition from Studio back to main site
    window.location.href = "/";
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading state while checking authentication and access
  if (loading || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin h-12 w-12 border-4 border-oma-plum border-t-transparent rounded-full mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-oma-gold/20"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              Loading Studio...
            </p>
            <p className="text-sm text-gray-500">Preparing your workspace</p>
          </div>
          <div className="flex justify-center space-x-1">
            <div
              className="w-2 h-2 bg-oma-plum rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-oma-plum rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-oma-plum rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // If no access, show a message (this will be briefly visible before redirect)
  if (!permissions.includes("studio.access")) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">
            You don't have permission to access the studio.
          </p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Create permission-based navigation items
  const getNavigationItems = () => {
    type NavigationItem = {
      href: string;
      label: string;
      icon: any;
      permission: string;
      customLabel?: string;
      showForRoles?: string[]; // New property for conditional visibility
    };

    const baseItems: NavigationItem[] = [
      {
        href: "/studio",
        label: "Dashboard",
        icon: Home,
        permission: "studio.access",
      },
    ];

    const permissionItems: NavigationItem[] = [
      {
        href: "/studio/brands",
        label: "Brands",
        icon: Package,
        permission: "studio.brands.manage",
        customLabel: user?.role === "brand_admin" ? "Your Brands" : "Brands",
      },
      {
        href: "/studio/collections",
        label: "Collections",
        icon: ImageIcon,
        permission: "studio.catalogues.manage",
        customLabel:
          user?.role === "brand_admin" ? "Your Collections" : "Collections",
      },
      {
        href: "/studio/products",
        label: "Products",
        icon: ShoppingBag,
        permission: "studio.products.manage",
        customLabel:
          user?.role === "brand_admin" ? "Your Products" : "Products",
      },
      {
        href: "/studio/services",
        label: "Services",
        icon: Scissors,
        permission: "studio.products.manage",
        customLabel:
          user?.role === "brand_admin" ? "Your Services" : "Services",
      },
      {
        href: "/studio/portfolio",
        label: "Portfolio",
        icon: ImageIcon,
        permission: "studio.hero.manage",
      },
      {
        href: "/studio/hero",
        label: "Hero Carousel",
        icon: Monitor,
        permission: "studio.hero.manage",
      },
      {
        href: "/studio/spotlight",
        label: "Spotlight",
        icon: ImageIcon,
        permission: "studio.hero.manage",
      },
      {
        href: "/studio/users",
        label: "Users",
        icon: Users,
        permission: "studio.users.manage",
      },
      {
        href: "/studio/reviews",
        label: "Reviews",
        icon: MessageSquare,
        permission: "studio.products.manage",
        customLabel: user?.role === "brand_admin" ? "Your Reviews" : "Reviews",
      },
      {
        href: "/studio/inbox",
        label: "Inbox",
        icon: Inbox,
        permission: "studio.products.manage",
        customLabel: user?.role === "brand_admin" ? "Your Inbox" : "Inbox",
      },
      {
        href: "/studio/applications",
        label: "Applications",
        icon: FileText,
        permission: "studio.users.manage",
        customLabel: "Applications",
        // Only show for super admins
        showForRoles: ["super_admin"]
      },
      {
        href: "/studio/subscriptions",
        label: "Subscriptions",
        icon: Mail,
        permission: "studio.users.manage",
        customLabel: "Subscriptions",
        showForRoles: ["super_admin"]
      },
      {
        href: "/studio/profile",
        label: "Profile",
        icon: User,
        permission: "studio.access",
      },
      {
        href: "/studio/settings",
        label: "Settings",
        icon: Settings,
        permission: "studio.settings.manage",
      },
    ];

    // Filter items based on permissions
    const filteredItems = permissionItems.filter((item) => {
      if (item.permission === "studio.access") return true;
      
      // Check if user has the required permission
      const hasPermission = permissions.includes(item.permission as any);
      
      // Check if item has role restrictions
      if (item.showForRoles && user?.role) {
        return hasPermission && item.showForRoles.includes(user.role);
      }
      
      return hasPermission;
    });

    return [...baseItems, ...filteredItems];
  };

  const navigationItems = getNavigationItems();

  // Add this helper for mobile nav items - now uses the same permission system
  const mobileNavItems = navigationItems;

  return (
    <StudioInitialDataProvider
      value={{
        profile: initialProfile,
        user: initialUser,
      }}
    >
      <ErrorBoundary>
        <TailoringEventProvider>
        <div
          className="min-h-screen bg-gray-50 flex flex-col"
          data-studio-page
          style={{
            position: "relative",
            overflow: "hidden auto",
          }}
        >
          {/* Studio Header */}
          <header
            className={`w-full bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-700 ease-out ${
              fadeIn ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            <div className="container mx-auto px-8 flex justify-between items-center">
              {/* Mobile sidebar toggle */}
              <div
                className={`lg:hidden flex items-center transition-all duration-700 ease-out ${
                  fadeIn
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-4"
                }`}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSidebar}
                  className="bg-white"
                >
                  {sidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Desktop: OmaHub logo */}
              <div
                className={`hidden lg:flex items-center transition-all duration-700 ease-out ${
                  fadeIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <button
                  onClick={handleBackToSite}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/lovable-uploads/omahub-logo.png"
                    alt="OmaHub"
                    width={90}
                    height={25}
                    className="h-6 w-auto"
                    priority
                  />
                </button>
              </div>

              {/* Mobile: OmaHub logo */}
              <div
                className={`lg:hidden flex-1 flex justify-center transition-all duration-700 ease-out ${
                  fadeIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <button
                  onClick={handleBackToSite}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/lovable-uploads/omahub-logo.png"
                    alt="OmaHub"
                    width={90}
                    height={25}
                    className="h-6 w-auto"
                    priority
                  />
                </button>
              </div>

              <div
                className={`hidden md:flex items-center space-x-4 transition-all duration-700 ease-out ${
                  fadeIn
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <button
                  onClick={handleBackToSite}
                  className="text-sm text-gray-600 hover:text-oma-plum transition-colors"
                >
                  Back to Site
                </button>
                <UserProfile />
              </div>

              {/* Mobile user profile */}
              <div
                className={`md:hidden transition-all duration-700 ease-out ${
                  fadeIn
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                <UserProfile />
              </div>
            </div>
          </header>

          {/* Overlay for mobile - cover entire screen */}
          {/* Removed overlay for cleaner mobile experience */}

          {/* Sidebar */}
          {/* Mobile Sidebar: Slide-in with buttons for navigation */}
          <aside
            className={`lg:hidden bg-white w-4/5 max-w-xs border-r border-gray-200 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } mt-16 shadow-xl`}
            aria-modal="true"
            role="dialog"
            aria-label="Studio navigation menu"
            aria-hidden={!sidebarOpen}
          >
            {/* Mobile Close Button */}
            <div className="flex items-center px-4 pt-4 pb-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="bg-white border-oma-plum"
                aria-label="Close navigation menu"
                aria-expanded={sidebarOpen}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-8 pt-4 pb-6 h-[calc(100vh-4rem)] overflow-y-auto flex flex-col">
              <div className="mb-8">
                <h1 className="text-2xl font-canela text-oma-plum">Studio</h1>
              </div>
              <nav
                className="space-y-1 flex-1 overflow-y-auto"
                role="navigation"
                aria-label="Studio navigation"
              >
                {mobileNavItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100 w-full text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-oma-plum focus:ring-offset-2"
                    aria-label={`Navigate to ${item.customLabel || item.label}`}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    <span>{item.customLabel || item.label}</span>
                  </button>
                ))}

                {/* Mobile Back to Site in sidebar */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleBackToSite();
                  }}
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100 w-full border-t border-gray-200 mt-4 pt-4"
                >
                  <Home className="h-5 w-5" />
                  <span>Back to Site</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Desktop Sidebar: Keep existing implementation */}
          <aside
            className={`hidden lg:block bg-white w-64 border-r border-gray-200 fixed inset-y-0 left-0 z-40 transition-all duration-700 ease-in-out lg:translate-x-0 mt-16 shadow-xl ${
              fadeIn ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            }`}
            aria-modal="true"
            role="dialog"
          >
            <div className="px-8 pt-8 pb-6 h-full flex flex-col overflow-y-auto">
              {/* Studio title only */}
              <div className="mb-8">
                <h1 className="text-2xl font-canela text-oma-plum">Studio</h1>
              </div>
              <nav className="space-y-1 flex-1 overflow-y-auto">
                {navigationItems.map((item) => (
                  <NavigationLink
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                    onClick={handleSidebarNav}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.customLabel || item.label}</span>
                  </NavigationLink>
                ))}

                {/* Mobile Back to Site in sidebar */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleBackToSite();
                  }}
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100 w-full lg:hidden border-t border-gray-200 mt-4 pt-4"
                >
                  <Home className="h-5 w-5" />
                  <span>Back to Site</span>
                </button>
              </nav>

              <div className="pt-6 border-t border-gray-200 mt-auto">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main
            className={`flex-1 lg:ml-64 mt-16 transition-all duration-700 ease-out ${
              fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="min-h-screen relative">{children}</div>
          </main>
        </div>
        </TailoringEventProvider>
      </ErrorBoundary>
    </StudioInitialDataProvider>
  );
}
