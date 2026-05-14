"use client";

import Link from "next/link";
import { Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-oma-beige">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Column 1: Branding */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <img
              src="/lovable-uploads/omahub-logo.png"
              alt="OmaHub"
              className="h-6 w-auto mb-4"
            />
            <div className="text-sm text-oma-cocoa/70">
              A curated platform spotlighting emerging designers
            </div>
          </div>

          {/* Column 2: Navigate - use nav + div stack (not ul/li) to avoid hydration edge cases */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-col items-center md:items-start"
          >
            <h3 className="text-xs font-medium uppercase tracking-wider text-oma-black mb-4">
              Navigate
            </h3>
            <div className="flex flex-col items-center gap-3 md:items-start">
              <Link
                href="/"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                Our Story
              </Link>
              <Link
                href="/directory"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                Explore Designers
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                How It Works
              </Link>
              <Link
                href="/contact"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                Contact Us
              </Link>
            </div>
          </nav>

          {/* Column 3: Resources */}
          <nav
            aria-label="Footer resources"
            className="flex flex-col items-center md:items-start"
          >
            <h3 className="text-xs font-medium uppercase tracking-wider text-oma-black mb-4">
              Resources
            </h3>
            <div className="flex flex-col items-center gap-3 md:items-start">
              <Link
                href="/join"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                Join the Hub
              </Link>
              <Link
                href="/terms-of-service"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                Privacy Policy
              </Link>
              <Link
                href="/faq"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                FAQs
              </Link>
              <a
                href="https://luma.com/user/usr-10IvrGBF3vxclvm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                Events
              </a>
              <Link
                href="/event-waitlist"
                className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline focus-visible:outline-none focus-visible:ring-0"
              >
                Event preorder
              </Link>
            </div>
          </nav>

          {/* Column 4: Connect */}
          <nav
            aria-label="Social links"
            className="flex flex-col items-center md:items-start"
          >
            <h3 className="text-xs font-medium uppercase tracking-wider text-oma-black mb-4">
              Connect
            </h3>
            <div className="flex flex-col items-center gap-3 md:items-start">
              <a
                href="https://www.instagram.com/_omahub/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-oma-cocoa hover:text-oma-plum flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-0"
              >
                <Instagram className="h-4 w-4 transition group-hover:text-oma-plum" />
                <span className="expand-underline">@omahub</span>
              </a>
              <a
                href="https://www.tiktok.com/@_omahub"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-oma-cocoa hover:text-oma-plum flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-0"
              >
                <svg
                  className="h-4 w-4 transition group-hover:text-oma-plum"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.321 5.562a5.122 5.122 0 01-.443-.258 6.228 6.228 0 01-1.137-.966c-.849-.849-1.377-2.016-1.377-3.338h-3.159v13.8c0 2.748-2.241 4.986-4.986 4.986-2.748 0-4.986-2.241-4.986-4.986s2.241-4.986 4.986-4.986c.516 0 1.014.084 1.479.237v-3.286c-.465-.069-.942-.105-1.479-.105C4.037 6.66 0 10.697 0 15.78s4.037 9.12 9.12 9.12 9.12-4.037 9.12-9.12V9.042a9.158 9.158 0 005.16 1.563V7.446c-1.398 0-2.688-.564-3.616-1.471-.316-.316-.591-.669-.82-1.056-.229-.384-.409-.804-.523-1.257z" />
                </svg>
                <span className="expand-underline">TikTok</span>
              </a>
            </div>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center sm:text-left">
          <p className="text-xs leading-5 text-oma-cocoa/80">
            &copy; {new Date().getFullYear()} OmaHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
