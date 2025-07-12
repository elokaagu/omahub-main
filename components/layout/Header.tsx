"use client";

import { useState, useEffect, useRef } from "react";
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
  getNavigationItems,
  type NavigationItem,
} from "@/components/ui/navigation";
import { supabase } from "@/lib/supabase";
import { getBrandsByCategory } from "@/lib/services/brandService";
import { checkCategoryHasBrands } from "@/lib/services/categoryService";
import { triggerSearchModal } from "@/components/ui/search-modal";

const collectionItems = collections.map((category) => ({
  name: category,
  href: `/directory?category=${category.replace(/ /g, "+")}`,
}));

const navigation = [
  { name: "Home", href: "/" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
];

// Fallback navigation items
const fallbackNavigationItems: NavigationItem[] = [
  {
    title: "Collections",
    href: "/collections",
    description: "Discover curated fashion collections and styles",
    items: [
      { title: "High End Fashion Brands", href: "/directory?category=Luxury" },
      { title: "Ready to Wear", href: "/directory?category=Ready+to+Wear" },
      { title: "Made to Measure", href: "/directory?category=Couture" },
      {
        title: "Streetwear & Urban",
        href: "/directory?category=Streetwear+%26+Urban",
      },
      { title: "Accessories", href: "/directory?category=Accessories" },
    ],
  },
  {
    title: "Tailored",
    href: "/tailored",
    description: "Masters of craft creating perfectly fitted garments",
    items: [
      { title: "Browse All Tailors", href: "/tailors" },
      { title: "Bridal", href: "/directory?category=Bridal" },
      { title: "Custom Design", href: "/directory?category=Custom+Design" },
      { title: "Evening Gowns", href: "/directory?category=Evening+Gowns" },
      { title: "Alterations", href: "/directory?category=Alterations" },
    ],
  },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { setIsNavigating } = useNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isNavigatingToStudio, setIsNavigatingToStudio] = useState(false);
  const [dynamicNavigationItems, setDynamicNavigationItems] = useState<
    NavigationItem[]
  >(fallbackNavigationItems);
  const [collectionsHasBrands, setCollectionsHasBrands] = useState(false);
  const [tailoredHasBrands, setTailoredHasBrands] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus trap for accessibility
  useEffect(() => {
    if (mobileMenuOpen && overlayRef.current) {
      const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) focusable[0].focus();
      const handleTab = (e: KeyboardEvent) => {
        if (!overlayRef.current) return;
        const focusableEls = overlayRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableEls[0];
        const last = focusableEls[focusableEls.length - 1];
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };
      document.addEventListener("keydown", handleTab);
      return () => document.removeEventListener("keydown", handleTab);
    }
  }, [mobileMenuOpen]);

  // Close menu on resize to lg or above
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    async function loadDynamicNavigation() {
      try {
        console.log("🔄 Header: Starting to load dynamic navigation...");

        // Load dynamic navigation items
        const dynamicItems = await getNavigationItems();
        console.log("📋 Header: Dynamic items loaded:", dynamicItems);

        setDynamicNavigationItems(dynamicItems);

        // Check if categories have brands (for mobile menu filtering)
        const [collectionsHasBrands, tailoredHasBrands] = await Promise.all([
          checkCategoryHasBrands("Collections"),
          checkCategoryHasBrands("Tailored"),
        ]);

        setCollectionsHasBrands(collectionsHasBrands);
        setTailoredHasBrands(tailoredHasBrands);

        console.log("✅ Header: Dynamic navigation loaded successfully", {
          itemsCount: dynamicItems.length,
          collectionsHasBrands,
          tailoredHasBrands,
          items: dynamicItems.map((item) => ({
            title: item.title,
            itemCount: item.items.length,
            items: item.items.map((subItem) => subItem.title),
          })),
        });
      } catch (error) {
        console.error("❌ Header: Error loading dynamic navigation:", error);
        // Fallback to static navigation on error
        setDynamicNavigationItems(fallbackNavigationItems);
      }
    }

    loadDynamicNavigation();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    // Clean up on unmount
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleStudioNavigation = async () => {
    console.log("Header: Studio navigation initiated");

    setIsNavigatingToStudio(true);
    setIsNavigating(true);

    try {
      // Add a timeout to prevent indefinite loading
      const navigationTimeout = setTimeout(() => {
        console.warn("Header: Studio navigation timeout, resetting state");
        setIsNavigatingToStudio(false);
        setIsNavigating(false);
      }, 5000);

      // Use router.push for better navigation handling
      await router.push("/studio");

      // Clear timeout if navigation succeeds
      clearTimeout(navigationTimeout);

      console.log("Header: Studio navigation completed");
    } catch (error) {
      console.error("Header: Error navigating to studio:", error);
      setIsNavigatingToStudio(false);
      setIsNavigating(false);
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[1000] transition-all duration-300",
        scrolled || !isHomePage
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      )}
    >
      <nav
        className={cn(
          "mx-auto flex w-full items-center justify-between p-6 lg:px-8",
          mobileMenuOpen ? "hidden lg:flex" : "flex"
        )}
      >
        {/* Logo */}
        <div className="flex lg:flex-1">
          <NavigationLink href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">OmaHub</span>
            <div className="relative">
              <Image
                className={cn(
                  "h-6 w-auto transition-all duration-300",
                  scrolled || !isHomePage
                    ? "brightness-0"
                    : "brightness-0 invert"
                )}
                src="/lovable-uploads/omahub-logo.png"
                alt="OmaHub"
                width={120}
                height={32}
                priority
              />
            </div>
          </NavigationLink>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className={cn(
              "-m-2.5 inline-flex items-center justify-center rounded-md p-2.5",
              scrolled || !isHomePage ? "text-oma-black" : "text-white"
            )}
            onClick={() => setMobileMenuOpen(true)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu-overlay"
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-8">
          {/* Direct category rendering like mobile */}
          {dynamicNavigationItems.map((category) => {
            console.log(
              `🔍 Header: Rendering desktop dropdown for ${category.title}:`,
              category.items.map((item) => `${item.title} (${item.count})`)
            );
            return (
              <div key={category.title} className="relative group">
                <button
                  className={cn(
                    "text-sm font-semibold leading-6 gap-x-2 bg-transparent flex items-center",
                    scrolled || !isHomePage
                      ? "text-oma-black hover:text-oma-plum"
                      : "text-white hover:text-white/80"
                  )}
                >
                  {category.title}
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div
                  className="absolute top-full left-0 mt-2 min-w-[340px] max-w-[min(98vw,600px)] bg-gradient-to-br from-white/70 to-oma-beige/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-oma-gold/40 ring-1 ring-oma-plum/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 mx-4 sm:mx-6 md:mx-8 lg:mx-12"
                  style={{ boxSizing: "border-box", right: 0, left: "auto" }}
                >
                  <div
                    className="px-6 py-4 w-full"
                    style={{ boxSizing: "border-box" }}
                  >
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {category.title}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      {category.items.map((item) => (
                        <NavigationLink
                          key={item.title}
                          href={item.href}
                          className="block rounded-md p-2 text-sm hover:bg-oma-beige/40 transition-colors whitespace-nowrap max-w-md"
                        >
                          <span className="font-medium text-gray-900 whitespace-nowrap block">
                            {item.title}
                          </span>
                        </NavigationLink>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6">
            <button
              onClick={triggerSearchModal}
              className={cn(
                "p-2 rounded-full transition-all duration-200 hover:scale-105",
                scrolled || !isHomePage
                  ? "text-oma-black hover:text-oma-plum hover:bg-oma-beige/20"
                  : "text-white hover:text-white/90 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
              )}
              aria-label="Search"
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
              <NavigationLink href="/directory">Explore Brands</NavigationLink>
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
                      <ul className="grid w-[220px] gap-1 p-3 bg-white shadow-lg rounded-lg border border-gray-100">
                        <li>
                          <NavigationMenuLink asChild>
                            <NavigationLink
                              href="/profile"
                              className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-oma-plum transition-colors"
                            >
                              <span>Profile</span>
                            </NavigationLink>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <NavigationLink
                              href="/favourites"
                              className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-oma-plum transition-colors"
                            >
                              <span>Favourites</span>
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
                                className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-oma-plum transition-colors disabled:opacity-50"
                              >
                                <span>
                                  Studio {isNavigatingToStudio && "..."}
                                </span>
                              </button>
                            </NavigationMenuLink>
                          </li>
                        )}
                        <li className="border-t border-gray-100 mt-2 pt-2">
                          <NavigationMenuLink asChild>
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <span>Sign Out</span>
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
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        ref={overlayRef}
        id="mobile-menu-overlay"
        className={cn(
          "fixed inset-0 z-[1100] w-full min-h-screen overflow-y-auto bg-white px-6 py-6 ring-1 ring-gray-900/10 transform transition-transform duration-300 ease-in-out transition-opacity lg:hidden",
          mobileMenuOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        )}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex items-center justify-between">
          <NavigationLink href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">OmaHub</span>
            <Image
              className="h-6 w-auto"
              src="/lovable-uploads/omahub-logo.png"
              alt="OmaHub"
              width={120}
              height={32}
            />
          </NavigationLink>
          <button
            type="button"
            className="-m-2.5 rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sr-only">Close menu</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flow-root">
          <div className="-my-6 divide-y divide-gray-500/10">
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
                    Explore Brands
                  </NavigationLink>
                </div>

                {/* Categories */}
                <div className="flex flex-col gap-y-2 bg-white/40 backdrop-blur-lg rounded-2xl border border-oma-gold/20 shadow-2xl p-4 z-[1200]">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                    Categories
                  </h3>
                  {dynamicNavigationItems
                    .filter((category) => {
                      if (category.title === "Collections")
                        return collectionsHasBrands;
                      if (category.title === "Tailored")
                        return tailoredHasBrands;
                      return true;
                    })
                    .map((category) => (
                      <div key={category.title} className="mb-2">
                        <NavigationLink
                          href={category.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          {category.title}
                        </NavigationLink>
                        <div className="flex flex-col gap-y-1 pl-4">
                          {category.items.map((item) => (
                            <NavigationLink
                              key={item.title}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block rounded-lg px-3 py-2 text-sm leading-7 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span>{item.title}</span>
                                {item.count && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {item.count}
                                  </span>
                                )}
                              </div>
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
                            {user.role === "admin" ||
                            user.role === "super_admin"
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
                        <span>Profile</span>
                      </NavigationLink>

                      <NavigationLink
                        href="/favourites"
                        onClick={() => setMobileMenuOpen(false)}
                        className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        <span>Favourites</span>
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
                          <span>Studio {isNavigatingToStudio && "..."}</span>
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
                        <span>Sign Out</span>
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
                      triggerSearchModal();
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
        </div>
      </div>
    </header>
  );
}
