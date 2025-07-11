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
      // Call custom onClick handler first
      if (onClick) {
        onClick();
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
