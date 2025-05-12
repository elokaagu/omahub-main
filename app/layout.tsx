import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "../components/layout/RootLayoutClient";
import { suisseIntl, canela } from "./fonts";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "OmaHub",
  description: "Your one-stop shop for African fashion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${suisseIntl.variable} ${canela.variable}`}>
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
        <Toaster />
      </body>
    </html>
  );
}
