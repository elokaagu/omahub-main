"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Home,
  Package,
  Image as ImageIcon,
  User,
  LogOut,
  Menu,
  X,
  Settings,
} from "@/components/ui/icons";
import {
  Monitor,
  ShoppingBag,
  Users,
  MessageSquare,
  Inbox,
  Scissors,
} from "lucide-react";
import {
  Permission,
  getUserPermissions,
} from "@/lib/services/permissionsService";
import { LoadingPage } from "@/components/ui/loading";
import UserProfile from "@/components/auth/UserProfile";
import { NavigationLink } from "@/components/ui/navigation-link";
import { TailoringEventProvider } from "@/contexts/NavigationContext";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pendingSidebarClose = useRef(false);

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

  useEffect(() => {
    const checkAccess = async () => {
      try {
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
      }
    };

    console.log("🚀 Studio Layout: useEffect triggered with:", {
      user: !!user,
      loading,
      isCheckingAccess,
    });
    checkAccess();
  }, [user, loading, router]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading studio...</p>
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

  // Add this helper for mobile nav items
  const mobileNavItems = [
    { href: "/studio", label: "Dashboard", icon: Home },
    { href: "/studio/brands", label: "Brands", icon: Package },
    { href: "/studio/collections", label: "Collections", icon: ImageIcon },
    { href: "/studio/products", label: "Products", icon: ShoppingBag },
    { href: "/studio/services", label: "Services", icon: Scissors },
    { href: "/studio/hero", label: "Hero Carousel", icon: Monitor },
    { href: "/studio/spotlight", label: "Spotlight", icon: ImageIcon },
    { href: "/studio/users", label: "Users", icon: Users },
    { href: "/studio/reviews", label: "Reviews", icon: MessageSquare },
    { href: "/studio/inbox", label: "Inbox", icon: Inbox },
    { href: "/studio/profile", label: "Profile", icon: User },
    { href: "/studio/settings", label: "Settings", icon: Settings },
  ];

  return (
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
        <header className="w-full bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50 h-16 flex items-center">
          <div className="container mx-auto px-8 flex justify-between items-center">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden flex items-center">
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
            <div className="hidden lg:flex items-center">
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
            <div className="lg:hidden flex-1 flex justify-center">
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

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={handleBackToSite}
                className="text-sm text-gray-600 hover:text-oma-plum transition-colors"
              >
                Back to Site
              </button>
              <UserProfile />
            </div>

            {/* Mobile user profile */}
            <div className="md:hidden">
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
        >
          {/* Mobile Close Button */}
          <div className="flex items-center px-4 pt-4 pb-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="bg-white border-oma-plum"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="px-8 pt-4 pb-6 h-[calc(100vh-4rem)] overflow-y-auto flex flex-col">
            <div className="mb-8">
              <h1 className="text-2xl font-canela text-oma-plum">Studio</h1>
            </div>
            <nav className="space-y-1 flex-1">
              {mobileNavItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100 w-full text-left"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Desktop Sidebar: Keep existing implementation */}
        <aside
          className={`hidden lg:block bg-white w-64 border-r border-gray-200 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 mt-16 shadow-xl`}
          aria-modal="true"
          role="dialog"
        >
          <div className="px-8 pt-8 pb-6 h-full flex flex-col">
            {/* Studio title only */}
            <div className="mb-8">
              <h1 className="text-2xl font-canela text-oma-plum">Studio</h1>
            </div>
            <nav className="space-y-1 flex-1">
              <NavigationLink
                href="/studio"
                className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                onClick={handleSidebarNav}
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </NavigationLink>
              {permissions.includes("studio.brands.manage") && (
                <NavigationLink
                  href="/studio/brands"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <Package className="h-5 w-5" />
                  <span>
                    {user?.role === "brand_admin" ? "Your Brands" : "Brands"}
                  </span>
                </NavigationLink>
              )}
              {permissions.includes("studio.catalogues.manage") && (
                <NavigationLink
                  href="/studio/collections"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <ImageIcon className="h-5 w-5" />
                  <span>
                    {user?.role === "brand_admin"
                      ? "Your Collections"
                      : "Collections"}
                  </span>
                </NavigationLink>
              )}
              {(user?.role === "super_admin" ||
                user?.role === "brand_admin") && (
                <NavigationLink
                  href="/studio/products"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>
                    {user?.role === "brand_admin"
                      ? "Your Products"
                      : "Products"}
                  </span>
                </NavigationLink>
              )}
              {(user?.role === "super_admin" ||
                user?.role === "brand_admin") && (
                <NavigationLink
                  href="/studio/services"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <Scissors className="h-5 w-5" />
                  <span>
                    {user?.role === "brand_admin"
                      ? "Your Services"
                      : "Services"}
                  </span>
                </NavigationLink>
              )}
              {user?.role === "super_admin" && (
                <NavigationLink
                  href="/studio/hero"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <Monitor className="h-5 w-5" />
                  <span>Hero Carousel</span>
                </NavigationLink>
              )}
              {user?.role === "super_admin" && (
                <NavigationLink
                  href="/studio/spotlight"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <ImageIcon className="h-5 w-5" />
                  <span>Spotlight</span>
                </NavigationLink>
              )}
              {user?.role === "super_admin" && (
                <NavigationLink
                  href="/studio/users"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <Users className="h-5 w-5" />
                  <span>Users</span>
                </NavigationLink>
              )}
              {(user?.role === "super_admin" ||
                user?.role === "brand_admin") && (
                <NavigationLink
                  href="/studio/reviews"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>
                    {user?.role === "brand_admin" ? "Your Reviews" : "Reviews"}
                  </span>
                </NavigationLink>
              )}
              {(user?.role === "super_admin" ||
                user?.role === "brand_admin") && (
                <NavigationLink
                  href="/studio/inbox"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <Inbox className="h-5 w-5" />
                  <span>
                    {user?.role === "brand_admin" ? "Your Inbox" : "Inbox"}
                  </span>
                </NavigationLink>
              )}
              <NavigationLink
                href="/studio/profile"
                className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                onClick={handleSidebarNav}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </NavigationLink>
              {permissions.includes("studio.settings.manage") && (
                <NavigationLink
                  href="/studio/settings"
                  className="flex items-center space-x-3 px-0 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={handleSidebarNav}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </NavigationLink>
              )}

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
        <main className="flex-1 lg:ml-64 mt-16">
          <div className="min-h-screen relative">{children}</div>
        </main>
      </div>
    </TailoringEventProvider>
  );
}
