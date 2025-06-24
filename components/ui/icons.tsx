"use client";

// This file re-exports icons from lucide-react to avoid import issues
import * as LucideIcons from "lucide-react";
import React from "react";

// Create fallback components for crucial icons
const FallbackCheckCircle = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
);

const FallbackSearch = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.3-4.3"></path>
  </svg>
);

const FallbackFilter = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const FallbackLayoutGrid = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const FallbackLayoutList = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="14" width="7" height="7"></rect>
    <rect x="3" y="3" width="7" height="7"></rect>
    <line x1="14" y1="4" x2="21" y2="4"></line>
    <line x1="14" y1="9" x2="21" y2="9"></line>
    <line x1="14" y1="15" x2="21" y2="15"></line>
    <line x1="14" y1="20" x2="21" y2="20"></line>
  </svg>
);

const FallbackMapPin = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const FallbackStar = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

// Export all icons with fallbacks
export const CheckCircle = LucideIcons.CheckCircle || FallbackCheckCircle;
export const Search = LucideIcons.Search || FallbackSearch;
export const Filter = LucideIcons.Filter || FallbackFilter;
export const LayoutGrid = LucideIcons.LayoutGrid || FallbackLayoutGrid;
export const LayoutList = LucideIcons.LayoutList || FallbackLayoutList;
export const MapPin = LucideIcons.MapPin || FallbackMapPin;
export const Star = LucideIcons.Star || FallbackStar;

// Export all other icons
export const {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User,
  Heart,
  Palette,
  LogOut,
  Home,
  Package,
  Image,
  Settings,
  RefreshCw,
  PlusCircle,
  Check,
  Circle,
  Edit,
  Trash2,
  Tag,
  Clock,
  Dot,
} = LucideIcons;
