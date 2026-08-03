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
import { useRouter } from "next/navigation";
import { triggerSearchModal } from "@/components/ui/search-modal";
import { useStudioPermissions } from "@/hooks/useStudioPermissions";
import { useCustomerSignupEnabled } from "@/hooks/useCustomerSignupEnabled";

const isDev = process.env.NODE_ENV === "development";

// Primary navigation shown in the drawer, in order.
const primaryLinks: { name: string; href: string; accent?: boolean }[] = [
  { name: "Home", href: "/" },
  { name: "Archive", href: "/editions" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
  { name: "Explore Brands", href: "/directory", accent: true },
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavigatingToStudio, setIsNavigatingToStudio] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setMenuOpen(false);

  // Lock page scroll while the drawer is open.
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.body.classList.toggle("overflow-hidden", menuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  // Close on Escape, close when the viewport grows to desktop, and trap
  // focus inside the drawer while it's open.
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

    // Move focus into the drawer on open.
    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    firstFocusable?.focus();

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

  const iconButtonClass = cn(
    "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 sm:size-10",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
    "text-oma-black hover:bg-oma-beige/20 hover:text-oma-plum focus-visible:ring-oma-plum/35"
  );

  const menuButtonClass =
    "-m-1 inline-flex items-center justify-center rounded-md p-2 text-oma-black transition-colors hover:text-oma-plum sm:-m-2.5 sm:p-2.5";

  return (
    // No filter/transform/backdrop-filter on this element: it must stay a
    // plain positioned ancestor so the fixed backdrop + drawer below size
    // against the viewport, not this header's own (much smaller) box.
    <header className="fixed top-0 left-0 right-0 z-[1000] transition-all duration-300">
      <nav className="mx-auto grid h-14 w-full grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-gray-100 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
        {/* Menu button, opens the drawer at every breakpoint */}
        <div className="flex min-w-0 justify-self-start">
          <button
            type="button"
            className={menuButtonClass}
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Logo, centered in its own grid track */}
        <NavigationLink href="/" className="justify-self-center p-1 sm:p-1.5">
          <span className="sr-only">OmaHub</span>
          <Image
            className="h-5 w-auto brightness-0 transition-all duration-300 sm:h-6"
            src="/lovable-uploads/omahub-logo.png"
            alt="OmaHub"
            width={126}
            height={25}
            priority
          />
        </NavigationLink>

        {/* Icon actions: search, account, shop */}
        <div className="flex min-w-0 items-center justify-self-end gap-x-0.5 sm:gap-x-1">
          <button
            type="button"
            onClick={triggerSearchModal}
            className={iconButtonClass}
            aria-label="Search"
          >
            <Search className="h-5 w-5 shrink-0" aria-hidden />
          </button>

          {user ? (
            <HeaderUserMenu
              showStudio={showStudioInNav}
              onStudioNavigate={handleStudioNavigation}
              studioNavigating={isNavigatingToStudio}
            />
          ) : (
            <NavigationLink
              href="/login"
              aria-label="Sign in"
              className={iconButtonClass}
            >
              <User className="h-5 w-5 shrink-0" aria-hidden />
            </NavigationLink>
          )}

          <NavigationLink
            href="/directory"
            aria-label="Explore brands"
            className={iconButtonClass}
          >
            <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
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
          "fixed inset-y-0 right-0 z-[1100] flex h-full w-full max-w-sm flex-col bg-oma-plum text-oma-cream shadow-2xl transition-transform duration-300 ease-smooth will-change-transform",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5">
          <NavigationLink href="/" onClick={closeMenu} className="p-1">
            <span className="sr-only">OmaHub home</span>
            <Image
              className="h-6 w-auto brightness-0 invert"
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
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-8">
          {/* Search */}
          <button
            type="button"
            onClick={() => {
              closeMenu();
              triggerSearchModal();
            }}
            className="group flex w-full items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-left text-sm text-oma-cream/60 transition-colors hover:border-oma-gold/50 hover:text-oma-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold/50"
          >
            <Search className="h-4 w-4 shrink-0 text-oma-gold" aria-hidden />
            <span>Search brands, collections…</span>
          </button>

          {/* Primary navigation */}
          <nav className="mt-9" aria-label="Primary">
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-oma-gold/80">
              Explore
            </p>
            <ul className="flex flex-col">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <NavigationLink
                    href={link.href}
                    onClick={closeMenu}
                    className={cn(
                      "group flex items-center justify-between border-b border-white/8 py-3.5 font-canela text-2xl transition-colors",
                      link.accent
                        ? "text-oma-gold hover:text-oma-gold/80"
                        : "text-oma-cream hover:text-oma-gold"
                    )}
                  >
                    <span>{link.name}</span>
                    <ChevronRight
                      className="h-5 w-5 -translate-x-1 text-oma-gold/60 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden
                    />
                  </NavigationLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Account links (signed in) */}
          {user && (
            <div className="mt-9">
              <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-oma-gold/80">
                Account
              </p>

              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {user.avatar_url ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.avatar_url}
                      alt={`${user.first_name || ""} ${user.last_name || ""}`}
                    />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-oma-gold/90 text-oma-plum">
                    <User className="h-5 w-5" />
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
                    className="flex items-center justify-between border-b border-white/8 py-3 text-base text-oma-cream transition-colors hover:text-oma-gold"
                  >
                    <span>Profile</span>
                    <ChevronRight className="h-4 w-4 text-oma-gold/50" aria-hidden />
                  </NavigationLink>
                </li>
                <li>
                  <NavigationLink
                    href="/favourites"
                    onClick={closeMenu}
                    className="flex items-center justify-between border-b border-white/8 py-3 text-base text-oma-cream transition-colors hover:text-oma-gold"
                  >
                    <span>Favourites</span>
                    <ChevronRight className="h-4 w-4 text-oma-gold/50" aria-hidden />
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
                      className="flex w-full items-center justify-between border-b border-white/8 py-3 text-left text-base text-oma-cream transition-colors hover:text-oma-gold disabled:opacity-50"
                    >
                      <span>Studio{isNavigatingToStudio ? "…" : ""}</span>
                      <ChevronRight className="h-4 w-4 text-oma-gold/50" aria-hidden />
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Pinned footer: primary action */}
        <div className="shrink-0 border-t border-white/10 px-6 py-5">
          {user ? (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                handleSignOut();
              }}
              className="flex w-full items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-oma-cream transition-colors hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold/50"
            >
              Sign Out
            </button>
          ) : (
            <div className="space-y-3">
              <NavigationLink
                href="/login"
                onClick={closeMenu}
                className="flex w-full items-center justify-center rounded-full bg-oma-gold px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-oma-plum transition-colors hover:bg-oma-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oma-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-oma-plum"
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
