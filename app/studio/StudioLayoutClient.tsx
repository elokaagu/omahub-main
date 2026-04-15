"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserPermissions,
  Permission,
  permissionsForProfileRole,
} from "@/lib/services/permissionsService";
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
import type { Database } from "@/lib/types/supabase";
import { StudioInitialDataProvider } from "@/contexts/StudioInitialDataContext";
import { PageTransition } from "@/components/ui/page-transition";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type StudioLayoutClientProps = {
  children: React.ReactNode;
  initialProfile: Profile | null;
  initialUser: StudioInitialUser | null;
};

type StudioInitialUser = {
  id: string;
  email: string | null;
  role?: Profile["role"] | null;
  owned_brands?: string[] | null;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: any;
  permission: string;
  customLabel?: string;
  showForRoles?: string[];
};

function useStudioDiagnostics() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Studio Layout Error:", event.error);
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
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "exception", {
          description: event.reason?.message || "Unhandled promise rejection",
          fatal: false,
        });
      }
    };

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
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("load", handleLoad);
    };
  }, []);
}

function buildNavigationItems(
  permissions: Permission[],
  role: string | null | undefined
): NavigationItem[] {
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
      customLabel: role === "brand_admin" ? "Your Brands" : "Brands",
    },
    {
      href: "/studio/collections",
      label: "Collections",
      icon: ImageIcon,
      permission: "studio.catalogues.manage",
      customLabel: role === "brand_admin" ? "Your Collections" : "Collections",
    },
    {
      href: "/studio/products",
      label: "Products",
      icon: ShoppingBag,
      permission: "studio.products.manage",
      customLabel: role === "brand_admin" ? "Your Products" : "Products",
    },
    {
      href: "/studio/services",
      label: "Services",
      icon: Scissors,
      permission: "studio.products.manage",
      customLabel: role === "brand_admin" ? "Your Services" : "Services",
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
      customLabel: role === "brand_admin" ? "Your Reviews" : "Reviews",
    },
    {
      href: "/studio/inbox",
      label: "Inbox",
      icon: Inbox,
      permission: "studio.products.manage",
      customLabel: role === "brand_admin" ? "Your Inbox" : "Inbox",
    },
    {
      href: "/studio/applications",
      label: "Applications",
      icon: FileText,
      permission: "studio.users.manage",
      customLabel: "Applications",
      showForRoles: ["super_admin"],
    },
    {
      href: "/studio/subscriptions",
      label: "Subscriptions",
      icon: Mail,
      permission: "studio.users.manage",
      customLabel: "Subscriptions",
      showForRoles: ["super_admin"],
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

  const filteredItems = permissionItems.filter((item) => {
    if (item.permission === "studio.access") return true;
    const hasPermission = permissions.includes(item.permission as any);
    if (item.showForRoles && role) {
      return hasPermission && item.showForRoles.includes(role);
    }
    return hasPermission;
  });

  // Brand admins land on /studio/brands (see app/studio/page.tsx); they don't need a platform-wide dashboard link.
  const dashboardItems = role === "brand_admin" ? [] : baseItems;

  return [...dashboardItems, ...filteredItems];
}

export default function StudioLayoutClient({
  children,
  initialProfile,
  initialUser,
}: StudioLayoutClientProps) {
  const { user, loading, signOut, attemptSessionRecovery } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const sessionRecoveryAttemptedRef = useRef(false);

  useEffect(() => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const serverRole = initialProfile?.role ?? initialUser?.role ?? null;
  const bootstrapPerms = permissionsForProfileRole(serverRole);

  const [permissions, setPermissions] = useState<Permission[]>(bootstrapPerms);
  /** When SSR already authenticated with studio access, do not block the shell on client auth hydration. */
  const [isCheckingAccess, setIsCheckingAccess] = useState(() => {
    const hasAccess = bootstrapPerms.includes("studio.access");
    if (hasAccess && initialUser) return false;
    return true;
  });

  // Trigger fade-in animation when content is ready
  useEffect(() => {
    if (
      !loading &&
      !isCheckingAccess &&
      permissions.includes("studio.access")
    ) {
      const timer = setTimeout(() => {
        setFadeIn(true);
      }, 48);
      return () => clearTimeout(timer);
    }
  }, [loading, isCheckingAccess, permissions]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const run = async () => {
      if (!user?.id) {
        if (
          initialUser?.id &&
          !sessionRecoveryAttemptedRef.current
        ) {
          sessionRecoveryAttemptedRef.current = true;
          const recovered = await attemptSessionRecovery();
          if (recovered) {
            return;
          }
        }
        sessionRecoveryAttemptedRef.current = false;
        setIsCheckingAccess(false);
        router.push("/login?redirect=/studio");
        return;
      }

      sessionRecoveryAttemptedRef.current = false;

      // Prefer SSR role when client user is still the generic placeholder ("user") from fast auth hydrate.
      const ssrRoleForSameUser =
        user.id === initialUser?.id
          ? (initialProfile?.role ?? initialUser?.role ?? null)
          : null;
      const effectiveRole =
        user.role && user.role !== "user"
          ? user.role
          : (ssrRoleForSameUser ?? user.role ?? null);

      let next = permissionsForProfileRole(effectiveRole);
      if (!next.includes("studio.access")) {
        next = await getUserPermissions(user.id);
      }

      if (
        !next.includes("studio.access") &&
        next.length === 0 &&
        user.id === initialUser?.id
      ) {
        const ssrBootstrap = permissionsForProfileRole(
          initialProfile?.role ?? initialUser?.role ?? null
        );
        if (ssrBootstrap.includes("studio.access")) {
          console.warn(
            "[studio] Permissions empty after DB check; using SSR role for this navigation (transient or RLS)."
          );
          next = ssrBootstrap;
        }
      }

      setPermissions(next);
      setIsCheckingAccess(false);

      if (!next.includes("studio.access")) {
        router.push("/");
      }
    };

    void run();
  }, [
    loading,
    user?.id,
    user?.role,
    router,
    initialUser?.id,
    initialProfile?.role,
    initialUser?.role,
    attemptSessionRecovery,
  ]);

  useStudioDiagnostics();

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

  /** SSR user but client auth not hydrated yet → avoid flashing shell or false "access denied". */
  const awaitingClientIdentity =
    initialUser?.id != null && user?.id == null;

  const showGlobalLoader =
    isCheckingAccess ||
    (loading && initialUser == null) ||
    awaitingClientIdentity;

  if (showGlobalLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white px-6">
        <p className="text-sm text-gray-500">Loading studio…</p>
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

  const ssrRoleForNav =
    user?.id === initialUser?.id
      ? (initialProfile?.role ?? initialUser?.role ?? null)
      : null;
  const roleForNav =
    user?.role && user.role !== "user"
      ? user.role
      : (ssrRoleForNav ?? user?.role ?? null);

  const navigationItems = buildNavigationItems(permissions, roleForNav);

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
            className={`w-full bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-500 ease-smooth ${
              fadeIn ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            <div className="w-full px-8 flex justify-between items-center">
              {/* Mobile sidebar toggle */}
              <div
                className={`lg:hidden flex items-center transition-all duration-500 ease-smooth ${
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
                className={`hidden lg:flex items-center transition-all duration-500 ease-smooth ${
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
                className={`lg:hidden flex-1 flex justify-center transition-all duration-500 ease-smooth ${
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
                className={`hidden md:flex items-center space-x-4 transition-all duration-500 ease-smooth ${
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
                className={`md:hidden transition-all duration-500 ease-smooth ${
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
            className={`lg:hidden bg-white w-4/5 max-w-xs border-r border-gray-200 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-smooth ${
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
                {navigationItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100 w-full text-left transition-[background-color,color,transform] duration-200 ease-smooth active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-oma-plum focus:ring-offset-2"
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
            className={`hidden lg:block bg-white w-64 border-r border-gray-200 fixed inset-y-0 left-0 z-40 transition-all duration-500 ease-smooth lg:translate-x-0 mt-16 shadow-xl ${
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
                    className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100 transition-[background-color,color,transform] duration-200 ease-smooth active:scale-[0.99]"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.customLabel || item.label}</span>
                  </NavigationLink>
                ))}

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
            className={`flex-1 lg:ml-64 mt-16 transition-all duration-500 ease-smooth ${
              fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="min-h-screen relative">
              <PageTransition routeKey={pathname} variant="studio">
                {children}
              </PageTransition>
            </div>
          </main>
        </div>
        </TailoringEventProvider>
      </ErrorBoundary>
    </StudioInitialDataProvider>
  );
}
