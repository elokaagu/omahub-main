"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CornerDownLeft,
  FileText,
  Loader2,
  Search,
  Shirt,
  Store,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPEN_SEARCH_EVENT } from "@/lib/search/openSearch";
import { MIN_QUERY_LENGTH } from "@/lib/search/searchQuery";
import { QUICK_LINK_IDS, SITE_PAGES } from "@/lib/search/searchPages";
import type { SearchGroup, SearchHit, SearchHitType } from "@/lib/search/types";
import { useSiteSearch } from "./useSiteSearch";

const TYPE_ICONS: Record<SearchHitType, LucideIcon> = {
  brand: Store,
  collection: Layers,
  product: Shirt,
  edition: CalendarDays,
  page: FileText,
};

const QUICK_LINKS: SearchGroup[] = [
  {
    type: "page",
    label: "Quick links",
    hits: QUICK_LINK_IDS.map((id) => SITE_PAGES.find((p) => p.id === id))
      .filter((page): page is (typeof SITE_PAGES)[number] => Boolean(page))
      .map(({ keywords: _keywords, ...hit }) => hit),
  },
];

const LISTBOX_ID = "site-search-results";
const optionId = (hit: SearchHit) => `site-search-${hit.type}-${hit.id}`;

/** Wrap the first case-insensitive occurrence of `query` in a <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-oma-gold/25 px-0.5 text-inherit">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

function HitThumbnail({ hit }: { hit: SearchHit }) {
  const Icon = TYPE_ICONS[hit.type];
  const [failed, setFailed] = useState(false);
  if (hit.image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny remote thumbs
      <img
        src={hit.image}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(
          "size-11 shrink-0 bg-oma-beige/60 object-cover",
          hit.type === "brand" ? "rounded-full" : "rounded-lg",
        )}
      />
    );
  }
  if (hit.type === "brand") {
    // No photo yet: a monogram reads better than a generic icon.
    return (
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-oma-plum/10 font-canela text-lg text-oma-plum"
      >
        {hit.title.trim().charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-oma-beige/60 text-oma-plum">
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

/**
 * Site-wide search dialog, opened with the header search button, ⌘K / Ctrl+K,
 * or `openSearch()`. Nothing is loaded until the visitor types.
 */
export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const search = useSiteSearch(open ? input : "");
  const showingResults = search.status !== "idle";
  const groups = showingResults ? search.groups : QUICK_LINKS;
  const hits = useMemo(() => groups.flatMap((group) => group.hits), [groups]);
  const activeHit = hits[activeIndex];

  // Open from the header / menu, and toggle with ⌘K / Ctrl+K.
  useEffect(() => {
    const show = () => setOpen(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // New results: highlight the first one.
  useEffect(() => {
    setActiveIndex(0);
  }, [groups]);

  // Keep the keyboard-selected row visible.
  useEffect(() => {
    if (!activeHit) return;
    document
      .getElementById(optionId(activeHit))
      ?.scrollIntoView({ block: "nearest" });
  }, [activeHit]);

  // Start fresh each time, however the dialog was closed (Esc, ⌘K, click).
  useEffect(() => {
    if (!open) setInput("");
  }, [open]);

  const handleOpenChange = useCallback((next: boolean) => setOpen(next), []);

  const go = (hit: SearchHit) => {
    handleOpenChange(false);
    router.push(hit.url);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter while an IME is composing confirms the characters - not a result.
    if (event.nativeEvent.isComposing || hits.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter" && activeHit) {
      event.preventDefault();
      go(activeHit);
    }
  };

  const isEmpty = search.status === "ready" && search.groups.length === 0;
  // First search in flight: nothing to show yet, so hold the space.
  const isFirstLoad = search.status === "loading" && search.groups.length === 0;
  let runningIndex = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1200] bg-oma-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-3 z-[1210] flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-oma-cocoa/10 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 sm:top-[12vh] sm:max-h-[76vh]"
          onOpenAutoFocus={(event) => {
            // Focus the input ourselves (Radix would pick the first button).
            event.preventDefault();
            document.getElementById("site-search-input")?.focus();
          }}
        >
          <DialogPrimitive.Title className="sr-only">Search OmaHub</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search designers, collections, products, editions and pages. Use
            the arrow keys to move through results and Enter to open one.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-3 border-b border-oma-cocoa/10 px-4 sm:px-5">
            {search.status === "loading" ? (
              <Loader2 className="size-5 shrink-0 animate-spin text-oma-plum" aria-hidden />
            ) : (
              <Search className="size-5 shrink-0 text-oma-cocoa/50" aria-hidden />
            )}
            <input
              id="site-search-input"
              type="search"
              role="combobox"
              aria-expanded
              aria-controls={LISTBOX_ID}
              aria-autocomplete="list"
              aria-activedescendant={activeHit ? optionId(activeHit) : undefined}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search OmaHub"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="h-14 min-w-0 flex-1 bg-transparent text-base text-oma-black placeholder:text-oma-cocoa/45 focus:outline-none sm:h-16 sm:text-lg [&::-webkit-search-cancel-button]:hidden"
            />
            <DialogPrimitive.Close className="shrink-0 rounded-md border border-oma-cocoa/15 px-2 py-1 text-xs font-medium text-oma-cocoa/70 transition-colors hover:border-oma-plum/40 hover:text-oma-plum focus:outline-none focus-visible:ring-2 focus-visible:ring-oma-plum/40">
              <span className="sm:hidden">Cancel</span>
              <span className="hidden sm:inline">Esc</span>
              <span className="sr-only"> - close search</span>
            </DialogPrimitive.Close>
          </div>

          <div
            id={LISTBOX_ID}
            role="listbox"
            aria-label="Search results"
            aria-busy={search.status === "loading"}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3"
          >
            {search.status === "error" ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-oma-cocoa">Search isn&apos;t working right now.</p>
                <button
                  type="button"
                  onClick={search.retry}
                  className="mt-3 text-sm font-medium text-oma-plum underline-offset-4 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : isFirstLoad ? (
              <div aria-hidden className="space-y-1 px-1 py-3">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="size-11 shrink-0 animate-pulse rounded-full bg-oma-beige/70" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3.5 w-2/5 animate-pulse rounded bg-oma-beige/70" />
                      <span className="block h-3 w-1/4 animate-pulse rounded bg-oma-beige/50" />
                    </span>
                  </div>
                ))}
              </div>
            ) : isEmpty ? (
              <div className="px-4 py-10 text-center">
                <p className="font-canela text-xl text-oma-black">
                  No results for &ldquo;{search.query}&rdquo;
                </p>
                <p className="mt-2 text-sm text-oma-cocoa/80">
                  Try a designer&apos;s name, a city, or a category like
                  &ldquo;bridal&rdquo;.
                </p>
                <Link
                  href="/directory"
                  onClick={() => handleOpenChange(false)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-oma-plum underline-offset-4 hover:underline"
                >
                  Browse all designers
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            ) : (
              <>
                {!showingResults && input.trim().length > 0 && (
                  <p className="px-3 pb-1 pt-2 text-xs text-oma-cocoa/60">
                    Keep typing - search starts at {MIN_QUERY_LENGTH} characters.
                  </p>
                )}
                {groups.map((group) => (
                  <div key={group.label} role="group" aria-label={group.label} className="py-1">
                    <p className="px-3 pb-1.5 pt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-oma-cocoa/55">
                      {group.label}
                    </p>
                    {group.hits.map((hit) => {
                      runningIndex += 1;
                      const index = runningIndex;
                      const active = index === activeIndex;
                      return (
                        <Link
                          key={optionId(hit)}
                          id={optionId(hit)}
                          href={hit.url}
                          prefetch={false}
                          role="option"
                          aria-selected={active}
                          tabIndex={-1}
                          onMouseMove={() => setActiveIndex(index)}
                          onClick={() => handleOpenChange(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                            active ? "bg-oma-beige/50" : "hover:bg-oma-beige/30",
                          )}
                        >
                          <HitThumbnail hit={hit} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate font-medium text-oma-black">
                                <Highlight text={hit.title} query={search.query} />
                              </span>
                              {hit.verified && (
                                <BadgeCheck
                                  className="size-4 shrink-0 text-oma-gold"
                                  aria-label="Verified"
                                />
                              )}
                            </span>
                            {hit.subtitle && (
                              <span className="mt-0.5 block truncate text-sm text-oma-cocoa/70">
                                {hit.subtitle}
                              </span>
                            )}
                          </span>
                          <CornerDownLeft
                            className={cn(
                              "hidden size-4 shrink-0 text-oma-plum sm:block",
                              active ? "opacity-100" : "opacity-0",
                            )}
                            aria-hidden
                          />
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          <p aria-live="polite" className="sr-only">
            {search.status === "ready"
              ? hits.length === 0
                ? `No results for ${search.query}`
                : `${hits.length} result${hits.length === 1 ? "" : "s"}`
              : ""}
          </p>

          <div className="hidden items-center gap-4 border-t border-oma-cocoa/10 px-5 py-2.5 text-xs text-oma-cocoa/60 sm:flex">
            <span>
              <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> to move
            </span>
            <span>
              <kbd className="font-sans">↵</kbd> to open
            </span>
            <span>
              <kbd className="font-sans">esc</kbd> to close
            </span>
            <span className="ml-auto">
              <kbd className="font-sans">⌘K</kbd> anywhere to search
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
