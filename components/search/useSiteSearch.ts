"use client";

import { useEffect, useRef, useState } from "react";
import { normaliseSearchQuery } from "@/lib/search/searchQuery";
import type { SearchGroup, SearchResponse } from "@/lib/search/types";

export type SiteSearchState = {
  /** idle = nothing to search yet (empty or 1-character input). */
  status: "idle" | "loading" | "ready" | "error";
  /** The query the current `groups` belong to. */
  query: string;
  groups: SearchGroup[];
};

const IDLE: SiteSearchState = { status: "idle", query: "", groups: [] };
const DEBOUNCE_MS = 180;

/**
 * Debounced search against /api/search. Earlier results stay on screen while
 * the next query loads (no flicker), stale responses are aborted, and each
 * query is fetched at most once per session.
 */
export function useSiteSearch(input: string): SiteSearchState & { retry: () => void } {
  const [state, setState] = useState<SiteSearchState>(IDLE);
  const [attempt, setAttempt] = useState(0);
  const cache = useRef(new Map<string, SearchGroup[]>());
  const query = normaliseSearchQuery(input);

  useEffect(() => {
    if (!query) {
      setState(IDLE);
      return;
    }

    const cached = cache.current.get(query);
    if (cached) {
      setState({ status: "ready", query, groups: cached });
      return;
    }

    setState((prev) => ({ ...prev, status: "loading" }));
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Search failed (${response.status})`);
        const data = (await response.json()) as SearchResponse;
        cache.current.set(query, data.groups);
        setState({ status: "ready", query, groups: data.groups });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Search error:", error);
        setState({ status: "error", query, groups: [] });
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
