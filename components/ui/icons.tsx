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

// Get icons from lucide-react or use fallbacks
export const CheckCircle = LucideIcons.CheckCircle || FallbackCheckCircle;
export const Search = LucideIcons.Search || FallbackSearch;

// Re-export all other icons
export const {
  Filter,
  LayoutGrid,
  LayoutList,
  Star,
  Menu,
  X,
  User,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  PlusCircle,
  Edit,
  Trash2,
  MapPin,
  Tag,
  Clock,
  Dot,
  // Add any other icons you use in your app
} = LucideIcons;
