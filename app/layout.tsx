import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "../components/layout/RootLayoutClient";
import { Preloader } from "@/components/ui/preloader";
import { suisseIntl, canela } from "./fonts";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";

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
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2D1921" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </Head>
      <body>
        <Preloader>
          <RootLayoutClient>{children}</RootLayoutClient>
        </Preloader>
        <Toaster position="top-right" duration={2000} />
        <Analytics />
      </body>
    </html>
  );
}
