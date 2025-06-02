"use client";

import React from "react";
import Link from "next/link";
import { useNavigation } from "@/contexts/NavigationContext";

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
  ...props
}: NavigationLinkProps) {
  const { setIsNavigating } = useNavigation();

  const handleClick = (e: React.MouseEvent) => {
    // Only show loading for different routes
    const currentPath = window.location.pathname;
    if (href !== currentPath) {
      setIsNavigating(true);
    }

    if (onClick) {
      onClick();
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
