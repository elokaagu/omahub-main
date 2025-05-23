"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, ChevronDown, User } from "lucide-react";
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
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-sm">
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
              className="h-6 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
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
                    className="text-sm font-semibold leading-6 text-oma-black hover:text-oma-plum expand-underline px-3 py-2"
                  >
                    <Link href={item.href}>{item.name}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-semibold leading-6 text-oma-black hover:text-oma-plum gap-x-2 bg-transparent">
                  New Collections
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-1 p-2 bg-white/80 backdrop-blur-sm">
                    {collectionItems.map((item) => (
                      <li key={item.name}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-oma-beige/50 hover:text-oma-plum focus:bg-oma-beige/50 focus:text-oma-plum"
                          >
                            <div className="text-sm font-semibold leading-none">
                              {item.name}
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-sm font-semibold leading-6 text-oma-black hover:text-oma-plum"
          >
            <Search className="h-5 w-5" />
          </button>
          <Button
            asChild
            variant="outline"
            className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
          >
            <Link href="/directory">Explore the Directory</Link>
          </Button>

          {user ? (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-oma-plum text-white hover:bg-oma-plum/90 hover:text-white">
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-1 p-2 bg-white/80 backdrop-blur-sm">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/profile"
                            className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-oma-beige/50 hover:text-oma-plum focus:bg-oma-beige/50 focus:text-oma-plum"
                          >
                            <div className="text-sm font-semibold leading-none">
                              Profile
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/favorites"
                            className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-oma-beige/50 hover:text-oma-plum focus:bg-oma-beige/50 focus:text-oma-plum"
                          >
                            <div className="text-sm font-semibold leading-none">
                              Favorites
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/orders"
                            className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-oma-beige/50 hover:text-oma-plum focus:bg-oma-beige/50 focus:text-oma-plum"
                          >
                            <div className="text-sm font-semibold leading-none">
                              Orders
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li className="border-t border-gray-200 mt-1 pt-1">
                        <NavigationMenuLink asChild>
                          <Link
                            href="/profile"
                            className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600"
                          >
                            <div className="text-sm font-semibold leading-none">
                              Sign Out
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
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
                  className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-oma-black hover:bg-oma-beige"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="-mx-3 block rounded-lg px-3 py-2">
                <button
                  onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                  className="flex w-full justify-between items-center text-base font-semibold leading-7 text-oma-black"
                >
                  New Collections
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isCollectionsOpen ? "rotate-180" : ""
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "pl-4 mt-1 space-y-2",
                    isCollectionsOpen ? "block" : "hidden"
                  )}
                >
                  {collectionItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-base leading-7 text-oma-black hover:bg-oma-beige"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="py-6 space-y-4">
              <Button
                asChild
                variant="outline"
                className="w-full border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
              >
                <Link href="/directory">Explore the Directory</Link>
              </Button>

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-oma-black hover:bg-oma-beige"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/favorites"
                    className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-oma-black hover:bg-oma-beige"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Favorites
                  </Link>
                  <Link
                    href="/profile"
                    className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-red-600 hover:bg-red-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Out
                  </Link>
                </>
              ) : (
                <Button
                  asChild
                  className="w-full bg-oma-plum hover:bg-oma-plum/90"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
}
