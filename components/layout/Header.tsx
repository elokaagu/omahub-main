"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  User,
  Heart,
  Palette,
  LogOut,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchModal } from "@/components/ui/search-modal";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { NavigationLink } from "@/components/ui/navigation-link";
import { collections } from "@/lib/data/directory";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter, usePathname } from "next/navigation";
import {
  navigationItems,
  type NavigationItem,
} from "@/components/ui/navigation";
import { supabase } from "@/lib/supabase";
import { getBrandsByCategory } from "@/lib/services/brandService";

const collectionItems = collections.map((category) => ({
  name: category,
  href: `/directory?category=${category.replace(/ /g, "+")}`,
}));

const navigation = [
  { name: "Home", href: "/" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { setIsNavigating } = useNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isNavigatingToStudio, setIsNavigatingToStudio] = useState(false);
  const [collectionsHasBrands, setCollectionsHasBrands] = useState(false);
  const [tailoredHasBrands, setTailoredHasBrands] = useState(false);

  useEffect(() => {
    const hasAdminAccess =
      user?.role === "admin" ||
      user?.role === "super_admin" ||
      user?.role === "brand_admin";
    console.log("Header user state:", {
      userId: user?.id,
      userRole: user?.role,
      hasAdminAccess,
      isSuperAdmin: user?.role === "super_admin",
    });

    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  useEffect(() => {
    async function checkCategoryBrands() {
      const collectionsBrands = await getBrandsByCategory("Ready to Wear");
      setCollectionsHasBrands(collectionsBrands.length > 0);
      const tailoredBrands = await getBrandsByCategory("Tailored");
      setTailoredHasBrands(tailoredBrands.length > 0);
    }
    checkCategoryBrands();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleStudioNavigation = async () => {
    console.log("🎨 Header: Studio navigation initiated");

    setIsNavigatingToStudio(true);
    setIsNavigating(true);

    try {
      // Add a timeout to prevent indefinite loading
      const navigationTimeout = setTimeout(() => {
        console.warn("⚠️ Header: Studio navigation timeout, resetting state");
        setIsNavigatingToStudio(false);
        setIsNavigating(false);
      }, 5000);

      // Use router.push for better navigation handling
      await router.push("/studio");

      // Clear timeout if navigation succeeds
      clearTimeout(navigationTimeout);

      console.log("✅ Header: Studio navigation completed");
    } catch (error) {
      console.error("❌ Header: Error navigating to studio:", error);
      setIsNavigatingToStudio(false);
      setIsNavigating(false);
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white shadow-sm"
          : isHomePage
            ? "bg-transparent"
            : "bg-white"
      )}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 pl-0">
            <Image
              src="/lovable-uploads/omahub-logo.png"
              alt="OmaHub"
              width={90}
              height={25}
              className={cn(
                "h-6 w-auto transition-opacity duration-300",
                isHomePage && !scrolled
                  ? "invert opacity-100"
                  : "opacity-0 absolute"
              )}
              priority
            />
            <Image
              src="/lovable-uploads/omahub-logo.png"
              alt="OmaHub"
              width={90}
              height={25}
              className={cn(
                "h-6 w-auto transition-opacity duration-300",
                isHomePage && !scrolled ? "opacity-0 absolute" : "opacity-100"
              )}
              priority
            />
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className={cn(
              "-m-2.5 inline-flex items-center justify-center rounded-md p-2.5",
              scrolled ? "text-gray-700" : "text-white"
            )}
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-6">
          <NavigationMenu>
            <NavigationMenuList className="gap-x-2">
              {navigation.map((item) => (
                <NavigationMenuItem key={item.name}>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      "text-sm font-semibold leading-6 expand-underline px-3 py-2",
                      scrolled || !isHomePage
                        ? "text-oma-black hover:text-oma-plum"
                        : "text-white hover:text-white/80"
                    )}
                  >
                    <NavigationLink href={item.href}>
                      {item.name}
                    </NavigationLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              {navigationItems
                .filter((category) => {
                  if (category.title === "Collections")
                    return collectionsHasBrands;
                  if (category.title === "Tailored") return tailoredHasBrands;
                  return true;
                })
                .map((category) => (
                  <NavigationMenuItem key={category.title}>
                    <NavigationMenuTrigger
                      className={cn(
                        "text-sm font-semibold leading-6 gap-x-2 bg-transparent",
                        scrolled || !isHomePage
                          ? "text-oma-black hover:text-oma-plum"
                          : "text-white hover:text-white/80"
                      )}
                    >
                      {category.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold mb-1 text-oma-black">
                            {category.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {category.description}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {category.items.map((item) => (
                            <NavigationMenuLink key={item.title} asChild>
                              <NavigationLink
                                href={item.href}
                                className="block select-none rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-oma-beige/50 hover:text-oma-plum focus:bg-oma-beige/50 focus:text-oma-plum"
                              >
                                {item.title}
                              </NavigationLink>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className={cn(
              "text-sm font-semibold leading-6",
              scrolled || !isHomePage
                ? "text-oma-black hover:text-oma-plum"
                : "text-white hover:text-white/80"
            )}
          >
            <Search className="h-5 w-5" />
          </button>
          <Button
            asChild
            variant="outline"
            className={cn(
              "transition-colors font-semibold",
              scrolled || !isHomePage
                ? "border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                : "border-white text-white bg-black/20 hover:bg-black/40 hover:text-white hover:border-white/50"
            )}
          >
            <NavigationLink href="/directory">
              Explore Brand Directory
            </NavigationLink>
          </Button>

          {user ? (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      scrolled || !isHomePage
                        ? "bg-oma-plum text-white hover:bg-oma-plum/90"
                        : "bg-white text-oma-plum hover:bg-white/90"
                    )}
                  >
                    {user.avatar_url ? (
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage
                          src={user.avatar_url}
                          alt={`${user.first_name || ""} ${user.last_name || ""}`}
                        />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="h-4 w-4 mr-2" />
                    )}
                    {user.first_name ? `${user.first_name}` : "My Account"}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-2 p-4 bg-white shadow-lg rounded-lg border border-gray-100">
                      <li>
                        <NavigationMenuLink asChild>
                          <NavigationLink
                            href="/profile"
                            className="flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-oma-plum transition-colors"
                          >
                            Profile
                          </NavigationLink>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <NavigationLink
                            href="/favourites"
                            className="flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-oma-plum transition-colors"
                          >
                            Favourites
                          </NavigationLink>
                        </NavigationMenuLink>
                      </li>
                      {(user?.role === "admin" ||
                        user?.role === "super_admin" ||
                        user?.role === "brand_admin") && (
                        <li>
                          <NavigationMenuLink asChild>
                            <button
                              onClick={handleStudioNavigation}
                              disabled={isNavigatingToStudio}
                              className="flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-oma-plum transition-colors disabled:opacity-50"
                            >
                              Studio {isNavigatingToStudio && "..."}
                            </button>
                          </NavigationMenuLink>
                        </li>
                      )}
                      <li className="border-t border-gray-100 mt-1 pt-1">
                        <NavigationMenuLink asChild>
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Sign Out
                          </button>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <Button
              asChild
              className={cn(
                scrolled || !isHomePage
                  ? "bg-oma-plum hover:bg-oma-plum/90 text-white"
                  : "bg-white text-oma-plum hover:bg-white/90"
              )}
            >
              <NavigationLink href="/login">Sign In</NavigationLink>
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden",
          mobileMenuOpen ? "fixed inset-0 z-50 bg-white" : "hidden"
        )}
      >
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <Link
            href="/"
            className="-m-1.5 pl-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src="/lovable-uploads/omahub-logo.png"
              alt="OmaHub"
              width={90}
              height={25}
              className="h-6 w-auto"
              priority
            />
          </Link>
          <button
            type="button"
            className="-m-2.5 rounded-md p-2.5 text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sr-only">Close menu</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[calc(100vh-80px)]">
          <div className="space-y-6">
            {/* Main Navigation */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                Navigate
              </h3>
              {navigation.map((item) => (
                <NavigationLink
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {item.name}
                </NavigationLink>
              ))}
              <NavigationLink
                href="/directory"
                onClick={() => setMobileMenuOpen(false)}
                className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-oma-plum hover:bg-oma-beige/50 transition-colors"
              >
                Explore Brand Directory
              </NavigationLink>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                Categories
              </h3>
              {navigationItems
                .filter((category) => {
                  if (category.title === "Collections")
                    return collectionsHasBrands;
                  if (category.title === "Tailored") return tailoredHasBrands;
                  return true;
                })
                .map((category) => (
                  <div key={category.title} className="space-y-2">
                    <NavigationLink
                      href={category.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      {category.title}
                    </NavigationLink>
                    <div className="pl-4 space-y-1">
                      {category.items.map((item) => (
                        <NavigationLink
                          key={item.title}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="-mx-3 block rounded-lg px-3 py-2 text-sm leading-7 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {item.title}
                        </NavigationLink>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* User Section */}
            <div className="border-t border-gray-200 pt-6">
              {user ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                    Account
                  </h3>

                  {/* User Info */}
                  <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                    {user.avatar_url ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.avatar_url}
                          alt={`${user.first_name || ""} ${user.last_name || ""}`}
                        />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 bg-oma-plum rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.first_name
                          ? `${user.first_name} ${user.last_name || ""}`.trim()
                          : user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.role === "admin" || user.role === "super_admin"
                          ? "Admin"
                          : "Member"}
                      </p>
                    </div>
                  </div>

                  {/* User Menu Items */}
                  <NavigationLink
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-5 w-5 text-gray-500" />
                    Profile
                  </NavigationLink>

                  <NavigationLink
                    href="/favourites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Heart className="h-5 w-5 text-gray-500" />
                    Favourites
                  </NavigationLink>

                  {/* Studio Access for Admins */}
                  {(user?.role === "admin" ||
                    user?.role === "super_admin" ||
                    user?.role === "brand_admin") && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleStudioNavigation();
                      }}
                      disabled={isNavigatingToStudio}
                      className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-oma-plum hover:bg-oma-beige/50 transition-colors disabled:opacity-50 w-full text-left"
                    >
                      <Palette className="h-5 w-5" />
                      Studio {isNavigatingToStudio && "..."}
                    </button>
                  )}

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                    Account
                  </h3>

                  {/* Sign In Button */}
                  <NavigationLink
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 flex items-center justify-center gap-3 rounded-lg px-3 py-4 text-base font-semibold leading-7 bg-oma-plum text-white hover:bg-oma-plum/90 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    Sign In
                  </NavigationLink>

                  {/* Sign Up Link */}
                  <NavigationLink
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block text-center rounded-lg px-3 py-2 text-sm leading-7 text-oma-plum hover:bg-oma-beige/50 transition-colors"
                  >
                    Don't have an account? Sign up
                  </NavigationLink>
                </div>
              )}
            </div>

            {/* Search Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors w-full text-left"
              >
                <Search className="h-5 w-5 text-gray-500" />
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
}
