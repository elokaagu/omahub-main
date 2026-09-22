"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, LayoutList, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { locations } from "@/lib/data/directory";
import { getAllCategoryNames } from "@/lib/data/unified-categories";
import {
  ALL_CATEGORIES,
  ALL_LOCATIONS,
  SORT_OPTIONS,
  activeFilterChips,
  directoryHref,
  type DirectoryQuery,
} from "./directoryQuery";

const TRIGGER_CLASS =
  "min-h-[44px] border-oma-gold/25 bg-white text-sm text-oma-black focus:ring-oma-plum/30";

type DirectoryFiltersProps = {
  query: DirectoryQuery;
  /** Number of designers matching the current filters. */
  resultCount: number;
  totalCount: number;
};

/**
 * Search, filters, sort and view toggle. Every choice lives in the URL, so
 * results survive a refresh and can be shared or linked to.
 */
export function DirectoryFilters({
  query,
  resultCount,
  totalCount,
}: DirectoryFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(query.q);

  // Keep the box in step when the URL changes (chips, clear all, back button).
  useEffect(() => setTerm(query.q), [query.q]);

  const apply = (changes: Partial<DirectoryQuery>) => {
    startTransition(() => {
      router.replace(directoryHref(query, changes), { scroll: false });
    });
  };

  // Debounce typing so every keystroke doesn't hit the server.
  useEffect(() => {
    if (term === query.q) return;
    const timer = window.setTimeout(() => apply({ q: term }), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `apply` is stable enough here
  }, [term, query.q]);

  const chips = activeFilterChips(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-oma-cocoa/50"
            aria-hidden
          />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search designers, categories, cities…"
            aria-label="Search designers"
            className="h-12 rounded-full border-oma-gold/25 bg-white pl-11 pr-10 text-base text-oma-black placeholder:text-oma-cocoa/50"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-oma-cocoa/60 transition-colors hover:bg-oma-beige hover:text-oma-black"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
          <Select
            value={query.category}
            onValueChange={(category) => apply({ category })}
          >
            <SelectTrigger aria-label="Category" className={cn(TRIGGER_CLASS, "lg:w-44")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>{ALL_CATEGORIES}</SelectItem>
              {getAllCategoryNames().map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={query.location}
            onValueChange={(location) => apply({ location })}
          >
            <SelectTrigger aria-label="Location" className={cn(TRIGGER_CLASS, "lg:w-40")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={query.sort}
            onValueChange={(sort) =>
              apply({ sort: sort as DirectoryQuery["sort"] })
            }
          >
            <SelectTrigger aria-label="Sort by" className={cn(TRIGGER_CLASS, "lg:w-40")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1 lg:col-span-none">
            <ViewToggle
              active={query.view === "grid"}
              label="Grid view"
              onClick={() => apply({ view: "grid" })}
              icon={<LayoutGrid className="size-4" aria-hidden />}
            />
            <ViewToggle
              active={query.view === "list"}
              label="List view"
              onClick={() => apply({ view: "list" })}
              icon={<LayoutList className="size-4" aria-hidden />}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p
          aria-live="polite"
          className="text-sm text-oma-cocoa/80"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Updating…
            </span>
          ) : (
            <>
              <span className="font-medium text-oma-black">{resultCount}</span>{" "}
              {resultCount === 1 ? "designer" : "designers"}
              {resultCount !== totalCount && ` of ${totalCount}`}
            </>
          )}
        </p>

        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => apply(chip.clear)}
            className="inline-flex items-center gap-1.5 rounded-full border border-oma-gold/30 bg-white px-3 py-1 text-xs text-oma-black transition-colors hover:border-oma-plum/40 hover:bg-oma-beige/50"
          >
            {chip.label}
            <X className="size-3" aria-hidden />
            <span className="sr-only">Remove filter</span>
          </button>
        ))}

        {chips.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-oma-plum hover:bg-oma-beige/60"
            onClick={() =>
              apply({ q: "", category: ALL_CATEGORIES, location: ALL_LOCATIONS })
            }
          >
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}

function ViewToggle({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border transition-colors",
        active
          ? "border-oma-plum/40 bg-oma-beige text-oma-plum"
          : "border-oma-gold/25 bg-white text-oma-cocoa/70 hover:text-oma-black",
      )}
    >
      {icon}
    </button>
  );
}
