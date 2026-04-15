"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavigationLink } from "@/components/ui/navigation-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown,
  Heart,
  LogOut,
  Palette,
  User,
} from "@/components/ui/icons";
import type { User as AuthUser } from "@/lib/services/authService";

type HeaderUserMenuProps = {
  scrolled: boolean;
  isHomePage: boolean;
  showStudio: boolean;
  onStudioNavigate: () => void | Promise<void>;
  studioNavigating: boolean;
};

function displayLabel(user: AuthUser) {
  const first = user.first_name?.trim();
  if (first) return first;
  const email = user.email?.trim();
  if (email) return email.split("@")[0] || "Account";
  return "My Account";
}

export function HeaderUserMenu({
  scrolled,
  isHomePage,
  showStudio,
  onStudioNavigate,
  studioNavigating,
}: HeaderUserMenuProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const onHero = !scrolled && isHomePage;
  const label = displayLabel(user);

  const handleSignOut = async () => {
    setOpen(false);
    try {
      setSigningOut(true);
      await signOut();
      router.push("/login");
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      setSigningOut(false);
    }
  };

  const handleStudio = async () => {
    setOpen(false);
    await onStudioNavigate();
  };

  const itemClass =
    "cursor-pointer rounded-md px-3 py-2.5 text-sm font-medium text-gray-800 focus:bg-gray-100 focus:text-gray-900";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-oma-plum/40 focus-visible:ring-offset-2",
            onHero
              ? "border-white/35 bg-white/12 text-white hover:bg-white/20 backdrop-blur-sm"
              : "border-gray-200 bg-gray-50 text-gray-900 shadow-sm hover:bg-gray-100"
          )}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Account menu for ${label}`}
        >
          {user.avatar_url ? (
            <Avatar className="h-7 w-7 border border-black/5">
              <AvatarImage
                src={user.avatar_url}
                alt=""
                className="object-cover"
              />
              <AvatarFallback className="bg-oma-plum/10 text-oma-plum">
                <User className="h-3.5 w-3.5" aria-hidden />
              </AvatarFallback>
            </Avatar>
          ) : (
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border",
                onHero
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-gray-200 bg-white text-gray-700"
              )}
            >
              <User className="h-3.5 w-3.5" aria-hidden />
            </span>
          )}
          <span className="max-w-[120px] truncate">{label}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 opacity-80 transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-1.5rem,240px)] rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-xl"
      >
        <DropdownMenuItem asChild className={cn(itemClass, "p-0 focus:bg-transparent")}>
          <NavigationLink
            href="/profile"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
            Profile
          </NavigationLink>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className={cn(itemClass, "p-0 focus:bg-transparent")}>
          <NavigationLink
            href="/favourites"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <Heart className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
            Favourites
          </NavigationLink>
        </DropdownMenuItem>

        {showStudio ? (
          <DropdownMenuItem
            className={cn(itemClass, "flex items-center gap-2")}
            onClick={() => void handleStudio()}
            disabled={studioNavigating}
          >
            <Palette className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
            {studioNavigating ? "Opening Studio…" : "Studio"}
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator className="my-1 bg-gray-200/80" />

        <DropdownMenuItem
          className={cn(
            itemClass,
            "flex items-center gap-2 text-red-600 focus:bg-red-50 focus:text-red-700"
          )}
          onClick={() => void handleSignOut()}
          disabled={signingOut}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {signingOut ? "Signing out…" : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
