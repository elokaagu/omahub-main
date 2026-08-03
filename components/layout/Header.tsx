"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Menu,
  X,
  Search,
  ChevronRight,
  User,
  ShoppingBag,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { NavigationLink } from "@/components/ui/navigation-link";
import { HeaderUserMenu } from "@/components/layout/HeaderUserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter, usePathname } from "next/navigation";
import { triggerSearchModal } from "@/components/ui/search-modal";
import { useStudioPermissions } from "@/hooks/useStudioPermissions";
import { useCustomerSignupEnabled } from "@/hooks/useCustomerSignupEnabled";

const isDev = process.env.NODE_ENV === "development";

const primaryLinks: { name: string; href: string; accent?: boolean }[] = [
  { name: "Home", href: "/" },
  { name: "Archive", href: "/editions" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
  { name: "Explore Brands", href: "/directory", accent: true },
];

const iconBtn =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-oma-black transition-colors duration-200 hover:bg-oma-beige/30 hover:text-oma-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-oma-plum/35 sm:size-10";

export default function Header() {
  const { user, signOut } = useAuth();
  const customerSignupEnabled = useCustomerSignupEnabled();
  const { hasStudioAccess } = useStudioPermissions(user?.id);
  const showStudioInNav =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "brand_admin" ||
    hasStudioAccess;
  const { setIsNavigating } = useNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavigatingToStudio, setIsNavigatingToStudio] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isTransparent = isHomePage && !hasScrolled && !menuOpen;
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.body.classList.toggle("overflow-hidden", menuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  useEffect(() => {
    if (!isHomePage) {
      setHasScrolled(true);
      return;
    }

    const onScroll = () => setHasScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomePage]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) closeMenu();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    drawerRef.current
      ?.querySelector<HTMLElement>('a[href], button:not([disabled])')
      ?.focus();

    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleStudioNavigation = async () => {
    setIsNavigatingToStudio(true);
    setIsNavigating(true);
    try {
      const timeout = setTimeout(() => {
        setIsNavigatingToStudio(false);
        setIsNavigating(false);
      }, 5000);
      await router.push("/studio");
      clearTimeout(timeout);
    } catch (error) {
      if (isDev) console.error("Header: Error navigating to studio:", error);
      setIsNavigatingToStudio(false);
      setIsNavigating(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] pt-[env(safe-area-inset-top,0px)] transition-all duration-300">
      {/*
        Three-zone bar: equal-width side columns keep the logo optically
        centred. Icon actions share one 36/40px touch size on mobile.
      */}
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex h-14 w-full max-w-[100vw] items-center px-3 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 sm:h-16 sm:px-5 lg:px-8",
          isTransparent
            ? "border-b border-transparent bg-transparent shadow-none"
            : "border-b border-black/[0.06] bg-white/95 shadow-sm backdrop-blur-md"
        )}
      >
        {/* Left zone */}
        <div className="flex min-w-0 flex-1 items-center justify-start">
          <button
            type="button"
            className={iconBtn}
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Centre zone — logo */}
        <div className="flex shrink-0 items-center justify-center px-2">
          <NavigationLink href="/" className="block py-1">
            <span className="sr-only">OmaHub</span>
            <Image
              className="h-[1.125rem] w-auto brightness-0 sm:h-6"
              src="/lovable-uploads/omahub-logo.png"
              alt="OmaHub"
              width={126}
              height={25}
              priority
            />
          </NavigationLink>
        </div>

        {/* Right zone — icon actions */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={triggerSearchModal}
            className={iconBtn}
            aria-label="Search"
          >
            <Search className="size-[1.125rem] sm:size-5" aria-hidden />
          </button>

          {user ? (
            <HeaderUserMenu
              compact
              showStudio={showStudioInNav}
              onStudioNavigate={handleStudioNavigation}
              studioNavigating={isNavigatingToStudio}
            />
          ) : (
            <NavigationLink
              href="/login"
              aria-label="Sign in"
              className={iconBtn}
            >
              <User className="size-[1.125rem] sm:size-5" aria-hidden />
            </NavigationLink>
          )}

          <NavigationLink
            href="/directory"
            aria-label="Explore brands"
            className={iconBtn}
          >
            <ShoppingBag className="size-[1.125rem] sm:size-5" aria-hidden />
          </NavigationLink>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={closeMenu}
        className={cn(
          "fixed inset-0 z-[1090] bg-oma-black/50 backdrop-blur-sm transition-opacity duration-300 ease-smooth",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className={cn(
          "fixed inset-y-0 left-0 z-[1100] flex h-full w-full max-w-[min(100vw,22rem)] flex-col bg-oma-plum text-oma-cream shadow-2xl transition-transform duration-300 ease-smooth will-change-transform",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
          <NavigationLink href="/" onClick={closeMenu} className="py-1">
            <span className="sr-only">OmaHub home</span>
            <Image
              className="h-5 w-auto brightness-0 invert sm:h-6"
              src="/lovable-uploads/omahub-logo.png"
              alt="OmaHub"
              width={126}
              height={25}
            />
          </NavigationLink>
          <button
            type="button"
            onClick={closeMenu}
            className="inline-flex size-10 items-center justify-center rounded-full text-oma-cream/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold/50"
          >
            <span className="sr-only">Close menu</span>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6 sm:py-8">
          <button
            type="button"
            onClick={() => {
              closeMenu();
              triggerSearchModal();
            }}
            className="flex w-full items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-left text-sm text-oma-cream/60 transition-colors hover:border-oma-gold/50 hover:text-oma-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold/50 sm:px-5 sm:py-3.5"
          >
            <Search className="size-4 shrink-0 text-oma-gold" aria-hidden />
            <span>Search brands, collections…</span>
          </button>

          <nav className="mt-8 sm:mt-9" aria-label="Primary">
            <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-oma-gold/80 sm:mb-4 sm:text-[0.7rem]">
              Explore
            </p>
            <ul className="flex flex-col">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <NavigationLink
                    href={link.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center justify-between border-b border-white/8 py-3 font-canela text-xl transition-colors sm:py-3.5 sm:text-2xl",
                      link.accent
                        ? "text-oma-gold hover:text-oma-gold/80"
                        : "text-oma-cream hover:text-oma-gold"
                    )}
                  >
                    <span>{link.name}</span>
                    <ChevronRight
                      className="size-4 text-oma-gold/50 sm:size-5"
                      aria-hidden
                    />
                  </NavigationLink>
                </li>
              ))}
            </ul>
          </nav>

          {user && (
            <div className="mt-8 sm:mt-9">
              <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-oma-gold/80 sm:mb-4 sm:text-[0.7rem]">
                Account
              </p>

              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {user.avatar_url ? (
                  <Avatar className="size-10">
                    <AvatarImage
                      src={user.avatar_url}
                      alt={`${user.first_name || ""} ${user.last_name || ""}`}
                    />
                    <AvatarFallback>
                      <User className="size-5" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-oma-gold/90 text-oma-plum">
                    <User className="size-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-oma-cream">
                    {user.first_name
                      ? `${user.first_name} ${user.last_name || ""}`.trim()
                      : user.email}
                  </p>
                  <p className="truncate text-xs text-oma-cream/50">
                    {user.role === "admin" || user.role === "super_admin"
                      ? "Admin"
                      : "Member"}
                  </p>
                </div>
              </div>

              <ul className="flex flex-col">
                <li>
                  <NavigationLink
                    href="/profile"
                    onClick={closeMenu}
                    className="flex items-center justify-between border-b border-white/8 py-3 text-sm text-oma-cream transition-colors hover:text-oma-gold sm:text-base"
                  >
                    <span>Profile</span>
                    <ChevronRight className="size-4 text-oma-gold/50" aria-hidden />
                  </NavigationLink>
                </li>
                <li>
                  <NavigationLink
                    href="/favourites"
                    onClick={closeMenu}
                    className="flex items-center justify-between border-b border-white/8 py-3 text-sm text-oma-cream transition-colors hover:text-oma-gold sm:text-base"
                  >
                    <span>Favourites</span>
                    <ChevronRight className="size-4 text-oma-gold/50" aria-hidden />
                  </NavigationLink>
                </li>
                {showStudioInNav && (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        handleStudioNavigation();
                      }}
                      disabled={isNavigatingToStudio}
                      className="flex w-full items-center justify-between border-b border-white/8 py-3 text-left text-sm text-oma-cream transition-colors hover:text-oma-gold disabled:opacity-50 sm:text-base"
                    >
                      <span>Studio{isNavigatingToStudio ? "…" : ""}</span>
                      <ChevronRight className="size-4 text-oma-gold/50" aria-hidden />
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-6 sm:py-5">
          {user ? (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                handleSignOut();
              }}
              className="flex w-full items-center justify-center rounded-full border border-white/20 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-oma-cream transition-colors hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold/50 sm:text-sm"
            >
              Sign Out
            </button>
          ) : (
            <div className="space-y-3">
              <NavigationLink
                href="/login"
                onClick={closeMenu}
                className="flex w-full items-center justify-center rounded-full bg-oma-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-oma-plum transition-colors hover:bg-oma-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-oma-plum sm:py-3.5 sm:text-sm"
              >
                Sign In
              </NavigationLink>
              {customerSignupEnabled && (
                <NavigationLink
                  href="/signup"
                  onClick={closeMenu}
                  className="block text-center text-sm text-oma-cream/70 transition-colors hover:text-oma-gold"
                >
                  Don&apos;t have an account?{" "}
                  <span className="font-medium text-oma-gold">Sign up</span>
                </NavigationLink>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
