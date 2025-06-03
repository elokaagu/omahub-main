"use client";

import React from "react";
import Link from "next/link";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRouter } from "next/navigation";

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

  const handleClick = (e: React.MouseEvent) => {
    try {
      // Get current path more reliably
      const currentPath = window.location.pathname + window.location.search;
      const targetPath = href;

      // Only show loading for different routes
      if (targetPath !== currentPath && !isNavigating) {
        console.log(
          "🔗 NavigationLink: Starting navigation from",
          currentPath,
          "to",
          targetPath
        );
        setIsNavigating(true);

        // Set a backup timeout in case the navigation context doesn't reset
        setTimeout(() => {
          console.log("🔗 NavigationLink: Backup timeout triggered");
          setIsNavigating(false);
        }, 4000);
      }

      // Call custom onClick handler if provided
      if (onClick) {
        onClick();
      }

      // For studio navigation or complex routes, use programmatic navigation
      if (href.startsWith("/studio") && currentPath !== href) {
        e.preventDefault();

        if (replace) {
          router.replace(href);
        } else {
          router.push(href);
        }
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
