"use client";

import React, { ReactNode } from "react";

// Simple animation components that don't rely on complex libraries
export const FadeIn = ({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => {
  return <div className={className}>{children}</div>;
};

export const SlideUp = ({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => {
  return <div className={className}>{children}</div>;
};

export const StaggerContainer = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={className}>{children}</div>;
};

export const StaggerItem = ({
  children,
  index = 0,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) => {
  return <div className={className}>{children}</div>;
};
