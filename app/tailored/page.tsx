import type { Metadata } from "next";
import TailoredClient from "./TailoredClient";

export const metadata: Metadata = {
  title: "Tailored Services | OmaHub",
  description:
    "Explore curated tailored fashion services and discover bespoke designers for your style needs.",
};

export default function TailoredPage() {
  return <TailoredClient />;
}
