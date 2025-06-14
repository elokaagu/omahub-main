import Link from "next/link";
import { Instagram, Twitter, Linkedin } from "lucide-react";

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

          {/* Column 2: Navigate */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-xs font-medium uppercase tracking-wider text-oma-black mb-4">
              Navigate
            </h3>
            <ul className="flex flex-col items-center space-y-3 md:items-start">
              <li>
                <Link
                  href="/"
                  className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline"
                >
                  Explore Designers
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-xs font-medium uppercase tracking-wider text-oma-black mb-4">
              Resources
            </h3>
            <ul className="flex flex-col items-center space-y-3 md:items-start">
              <li>
                <Link
                  href="/join"
                  className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline"
                >
                  Join the Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm text-oma-cocoa hover:text-oma-plum expand-underline"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-xs font-medium uppercase tracking-wider text-oma-black mb-4">
              Connect
            </h3>
            <ul className="flex flex-col items-center space-y-3 md:items-start">
              <li>
                <a
                  href="https://www.instagram.com/_omahub/"
                  className="text-sm text-oma-cocoa hover:text-oma-plum flex items-center gap-2 group"
                >
                  <Instagram className="h-4 w-4 transition group-hover:text-oma-plum" />
                  <span className="expand-underline">@omahub</span>
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  className="text-sm text-oma-cocoa hover:text-oma-plum flex items-center gap-2 group"
                >
                  <Twitter className="h-4 w-4 transition group-hover:text-oma-plum" />
                  <span className="expand-underline">Twitter</span>
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  className="text-sm text-oma-cocoa hover:text-oma-plum flex items-center gap-2 group"
                >
                  <Linkedin className="h-4 w-4 transition group-hover:text-oma-plum" />
                  <span className="expand-underline">LinkedIn</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Block */}
        <div className="mt-12 py-6 flex flex-col sm:flex-row items-center justify-between border-t border-b border-oma-gold/20">
          <p className="text-sm text-oma-plum font-medium mb-3 sm:mb-0">
            Want early access to new collections and drops?
          </p>
          <a
            href="https://instagram.com/omahub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-oma-cocoa hover:text-oma-plum transition-colors"
          >
            <span className="expand-underline">Join the newsletter</span>
          </a>
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
