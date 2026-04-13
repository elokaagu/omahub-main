import type { ReactNode } from "react";
import { AboutOrganizationJsonLd } from "./organization-json-ld";

// Single source of truth for route metadata; /about/page is client-only.
export { metadata } from "./metadata";

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AboutOrganizationJsonLd />
      {children}
    </>
  );
}
