"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Image as ImageIcon, Package, Settings } from "lucide-react";
import { getAllEditions } from "@/lib/data/editions";
import { supabase } from "@/lib/supabase";
import { fetchStudioApplications } from "@/app/studio/applications/studioApplicationsApi";

type OverviewCounts = {
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

export function StudioHomeOverview() {
  const [counts, setCounts] = useState<OverviewCounts>({
    brands: null,
    editions: getAllEditions().length,
    applications: null,
    newApplications: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [brandResult, applications] = await Promise.all([
        supabase
          ? supabase.from("brands").select("id", { count: "exact", head: true })
          : Promise.resolve({ count: null, error: null }),
        fetchStudioApplications().catch(() => []),
      ]);

      if (cancelled) return;

      setCounts({
        brands: brandResult.error ? null : (brandResult.count ?? 0),
        editions: getAllEditions().length,
        applications: applications.length,
        newApplications: applications.filter((app) => app.status === "new")
          .length,
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          const count =
            item.countKey === "brands"
              ? counts.brands
              : item.countKey === "editions"
                ? counts.editions
                : item.countKey === "applications"
                  ? counts.applications
                  : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-oma-beige/70 bg-white p-5 shadow-sm transition-colors hover:border-oma-gold/50 hover:bg-oma-cream/40"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-oma-beige/60 text-oma-plum">
                  <Icon className="h-5 w-5" />
                </span>
                {item.countKey ? (
                  <span className="font-canela text-2xl tabular-nums text-oma-plum">
                    {formatCount(count)}
                  </span>
                ) : null}
              </div>
              <h2 className="font-canela text-xl text-oma-black">{item.title}</h2>
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
          );
        })}
      </div>
    </div>
  );
}
