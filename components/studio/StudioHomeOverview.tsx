"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Image as ImageIcon, Package, Settings } from "lucide-react";
export type OverviewCounts = {
  brands: number | null;
  editions: number;
  applications: number | null;
  newApplications: number | null;
};

const SHORTCUTS = [
  {
    href: "/studio/brands",
    title: "Brands",
    description: "Edit directory profiles, photos, and listings",
    icon: Package,
    countKey: "brands" as const,
  },
  {
    href: "/studio/editions",
    title: "Editions",
    description: "Cover, story, and lineup for each public edition",
    icon: ImageIcon,
    countKey: "editions" as const,
  },
  {
    href: "/studio/applications",
    title: "Applications",
    description: "Review designers who applied to join OmaHub",
    icon: FileText,
    countKey: "applications" as const,
  },
  {
    href: "/studio/settings",
    title: "Homepage",
    description: "Change the live hero still or film",
    icon: Settings,
    countKey: null,
  },
];

function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return String(value);
}

const BLUR_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Shortcut cards for Studio home. Counts are fetched on the server. */
export function StudioHomeOverview({ counts }: { counts: OverviewCounts }) {
  const reduceMotion = useReducedMotion();
  const skipMotion = reduceMotion === true;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SHORTCUTS.map((item, index) => {
          const Icon = item.icon;
          const count =
            item.countKey === "brands"
              ? counts.brands
              : item.countKey === "editions"
                ? counts.editions
                : item.countKey === "applications"
                  ? counts.applications
                  : null;
          const countReady = !item.countKey || count != null;

          return (
            <motion.div
              key={item.href}
              className="h-full"
              initial={
                skipMotion
                  ? false
                  : { opacity: 0, filter: "blur(18px)", y: 12 }
              }
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{
                duration: skipMotion ? 0 : 0.7,
                delay: skipMotion ? 0 : index * 0.12,
                ease: BLUR_EASE,
              }}
            >
              <Link
                href={item.href}
                className="group flex h-full flex-col rounded-2xl border border-oma-beige/70 bg-white p-5 shadow-sm transition-colors hover:border-oma-gold/50 hover:bg-oma-cream/40"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-oma-beige/60 text-oma-plum">
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.countKey ? (
                    <motion.span
                      key={countReady ? String(count) : "pending"}
                      initial={
                        skipMotion
                          ? false
                          : { opacity: 0.35, filter: "blur(10px)" }
                      }
                      animate={{
                        opacity: countReady ? 1 : 0.4,
                        filter: countReady ? "blur(0px)" : "blur(10px)",
                      }}
                      transition={{
                        duration: skipMotion ? 0 : 0.55,
                        delay: skipMotion ? 0 : index * 0.12 + 0.08,
                        ease: BLUR_EASE,
                      }}
                      className="font-canela text-2xl tabular-nums text-oma-plum"
                    >
                      {formatCount(count)}
                    </motion.span>
                  ) : null}
                </div>
                <h2 className="font-canela text-xl text-oma-black">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-oma-cocoa">
                  {item.description}
                </p>
                {item.countKey === "applications" &&
                counts.newApplications != null &&
                counts.newApplications > 0 ? (
                  <p className="mt-3 text-xs font-medium text-oma-plum">
                    {counts.newApplications} new to review
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-oma-cocoa/80 group-hover:text-oma-plum">
                    Open
                  </p>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
