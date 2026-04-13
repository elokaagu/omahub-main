import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Internal motion playground — not for search indexing. */
export const metadata: Metadata = {
  title: "Animation Demo",
  robots: { index: false, follow: false },
};

export default function AnimationDemoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
