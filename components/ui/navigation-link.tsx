"use client";

import React from "react";
import Link from "next/link";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRouter, usePathname } from "next/navigation";

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      // Call custom onClick handler first
      if (onClick) {
        onClick(e);
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
      if (process.env.NODE_ENV === "development") {
        console.error("NavigationLink handleClick error:", error);
      }
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
