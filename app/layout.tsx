import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "../components/layout/RootLayoutClient";
import { suisseIntl, canela } from "./fonts";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "OmaHub",
  description: "Your one-stop shop for global fashion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${suisseIntl.variable} ${canela.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="32x32" />
      </head>
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
