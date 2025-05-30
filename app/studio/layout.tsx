"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/lib/services/studioService";
import { Toaster } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  Package,
  Image,
  User,
  LogOut,
  Menu,
  X,
  Settings,
} from "@/components/ui/icons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log("Checking studio access:", { user, loading });

        if (loading) {
          console.log("Auth is still loading...");
          return;
        }

        if (!user) {
          console.log("No user found, redirecting to login");
          router.push("/login?redirect=/studio");
          return;
        }

        // Check if user has admin role directly from the user object
        const hasAdminRole =
          user.role === "admin" || user.role === "super_admin";
        console.log("User role check:", { role: user.role, hasAdminRole });

        if (!hasAdminRole) {
          // Double check with the server
          console.log("Double checking admin access for user:", user.id);
          const adminAccess = await isAdmin(user.id);
          console.log("Server admin check result:", adminAccess);

          if (!adminAccess) {
            console.log("User does not have admin access, redirecting to home");
            router.push("/");
            return;
          }
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Error checking admin access:", error);
        router.push("/");
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user, loading, router]);

  // Show loading state while checking authentication and access
  if (loading || isCheckingAccess) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If no access, show a message (this will be briefly visible before redirect)
  if (!hasAccess || !user) {
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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Studio Header */}
      <header className="w-full bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50 h-16 flex items-center">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-canela text-oma-plum">
            OmaHub
          </Link>
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-oma-plum"
            >
              Back to Site
            </Link>
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {user.first_name
                    ? `${user.first_name} ${user.last_name || ""}`
                    : user.email}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.avatar_url || ""}
                    alt={user.first_name || "User"}
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
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

      {/* Sidebar */}
      <aside
        className={`bg-white w-64 border-r border-gray-200 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } mt-16`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-canela text-oma-plum">Studio</h1>
          </div>

          <nav className="space-y-1 flex-1">
            <Link
              href="/studio"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/studio/brands"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <Package className="h-5 w-5" />
              <span>Brands</span>
            </Link>
            <Link
              href="/studio/collections"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <Image className="h-5 w-5" />
              <span>Collections</span>
            </Link>
            <Link
              href="/studio/profile"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
            <Link
              href="/studio/settings"
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>

          <div className="pt-6 border-t border-gray-200 mt-auto">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100 w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-0 lg:ml-64 min-h-screen mt-16">
        <div className="p-6">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Toaster />
    </div>
  );
}
