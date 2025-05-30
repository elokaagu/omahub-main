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
import { collections } from "@/lib/data/directory";
import { useAuth } from "@/lib/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  navigationItems,
  type NavigationItem,
} from "@/components/ui/navigation";

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
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "bg-white shadow-sm" : "bg-transparent"
      )}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 pl-0">
            <Image
              src="/lovable-uploads/omahub-logo-white.png"
              alt="OmaHub"
              width={90}
              height={25}
              className={cn(
                "h-6 w-auto transition-opacity duration-300",
                scrolled ? "opacity-0 absolute" : "opacity-100"
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
                scrolled ? "opacity-100" : "opacity-0 absolute"
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
                      scrolled
                        ? "text-oma-black hover:text-oma-plum"
                        : "text-white hover:text-white/80"
                    )}
                  >
                    <Link href={item.href}>{item.name}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              {navigationItems.map((category) => (
                <NavigationMenuItem key={category.title}>
                  <NavigationMenuTrigger
                    className={cn(
                      "text-sm font-semibold leading-6 gap-x-2 bg-transparent",
                      scrolled
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
                            <Link
                              href={item.href}
                              className="block select-none rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-oma-beige/50 hover:text-oma-plum focus:bg-oma-beige/50 focus:text-oma-plum"
                            >
                              {item.title}
                            </Link>
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
              scrolled
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
              scrolled
                ? "border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                : "border-white text-white hover:bg-white/20 hover:text-white hover:border-white/50"
            )}
          >
            <Link href="/directory">Explore the Directory</Link>
          </Button>

          {user ? (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      scrolled
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
                          <Link
                            href="/profile"
                            className="flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-oma-plum transition-colors"
                          >
                            Profile
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/favorites"
                            className="flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-oma-plum transition-colors"
                          >
                            Favorites
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {(user?.role === "admin" ||
                        user?.role === "super_admin") && (
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/studio"
                              className="flex items-center gap-2 w-full rounded-md p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-oma-plum transition-colors"
                            >
                              Studio
                            </Link>
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
                scrolled
                  ? "bg-oma-plum hover:bg-oma-plum/90 text-white"
                  : "bg-white text-oma-plum hover:bg-white/90"
              )}
            >
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden",
          mobileMenuOpen ? "fixed inset-0 z-50 bg-white px-6 py-6" : "hidden"
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="-m-1.5 pl-0">
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
            className="-m-2.5 rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sr-only">Close menu</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flow-root">
          <div className="-my-6 divide-y divide-gray-500/10">
            <div className="space-y-2 py-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                >
                  {item.name}
                </Link>
              ))}
              {navigationItems.map((category) => (
                <div key={category.title} className="space-y-2">
                  <Link
                    href={category.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    {category.title}
                  </Link>
                  <div className="pl-4 space-y-1">
                    {category.items.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="-mx-3 block rounded-lg px-3 py-2 text-sm leading-7 text-gray-700 hover:bg-gray-50"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="py-6">
              {user ? (
                <div className="space-y-3">
                  <Link
                    href="/profile"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/favorites"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    Favorites
                  </Link>
                  {(user?.role === "admin" || user?.role === "super_admin") && (
                    <Link
                      href="/studio"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    >
                      Studio
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
}
