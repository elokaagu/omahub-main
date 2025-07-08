"use client";

import React from "react";
import Link from "next/link";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRouter, usePathname } from "next/navigation";

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
}

export function NavigationLink({
  href,
  children,
  className,
  onClick,
  replace = false,
  ...props
}: NavigationLinkProps) {
  const { setIsNavigating, isNavigating } = useNavigation();
  const router = useRouter();
  const currentPathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    try {
      // Get current path more reliably
      const currentPath =
        currentPathname +
        (typeof window !== "undefined" ? window.location.search : "");
      const targetPath = href;

      // Call custom onClick handler first
      if (onClick) {
        onClick();
      }

      // Don't show loading for same route or if already navigating
      if (targetPath === currentPath || isNavigating) {
        return;
      }

      console.log(
        `🔗 NavigationLink: Starting navigation from ${currentPath} to ${targetPath}`
      );
      setIsNavigating(true);

      // For studio navigation, use programmatic navigation without scroll interference
      if (href.startsWith("/studio") && currentPath !== href) {
        e.preventDefault();

        // Use requestAnimationFrame to ensure smooth navigation
        requestAnimationFrame(() => {
          if (replace) {
            router.replace(href, { scroll: false });
          } else {
            router.push(href, { scroll: false });
          }
        });

        // Reset navigation state after navigation completes
        setTimeout(() => {
          setIsNavigating(false);
        }, 100);

        return;
      }

      // For external links, don't show loading
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        setIsNavigating(false);
        return;
      }
    } catch (error) {
      console.error("🔗 NavigationLink: Error in handleClick:", error);
      // Reset navigation state on error
      setIsNavigating(false);
    }
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      replace={replace}
      {...props}
    >
      {children}
    </Link>
  );
}
