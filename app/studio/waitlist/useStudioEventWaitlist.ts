"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lead } from "../leads/types";
import { normalizeLeads } from "../leads/types";

const POLL_MS = 60_000;

type LoadReason = "initial" | "manual" | "poll";

export function useStudioEventWaitlist(options: {
  userId: string | null | undefined;
  authLoading: boolean;
  enabled: boolean;
}) {
  const { userId, authLoading, enabled } = options;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadBatchSeqRef = useRef(0);
  const hasCompletedInitialLoadRef = useRef(false);

  const fetchList = useCallback(async (): Promise<Lead[]> => {
    const response = await fetch(
      `/api/leads?action=list&page=1&limit=100&eventWaitlist=1&_t=${Date.now()}`,
      {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
    if (response.status === 403) {
      throw new Error("You do not have permission to view the waitlist.");
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        typeof errorData.error === "string"
          ? errorData.error
          : "Failed to load waitlist",
      );
    }
    const result = await response.json();
    return normalizeLeads(result.leads);
  }, []);

  const loadAll = useCallback(
    async (reason: LoadReason = "initial") => {
      if (!userId || !enabled) return;

      const seq = ++loadBatchSeqRef.current;
      const isStale = () => seq !== loadBatchSeqRef.current;

      if (reason === "manual" || reason === "initial") {
        setError(null);
      }

      const hasData = hasCompletedInitialLoadRef.current;
      if (!hasData) {
        setLoading(true);
      } else if (reason === "manual") {
        setRefreshing(true);
      }

      try {
        const rows = await fetchList();
        if (isStale()) return;
        setLeads(rows);
        setError(null);
      } catch (e) {
        if (!isStale()) {
          console.error("Error loading event waitlist:", e);
          setLeads([]);
          setError(e instanceof Error ? e.message : "Failed to load waitlist");
        }
      } finally {
        if (!isStale()) {
          setLoading(false);
          setRefreshing(false);
          hasCompletedInitialLoadRef.current = true;
        }
      }
    },
    [userId, enabled, fetchList],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!enabled || !userId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    void loadAll("initial");
  }, [userId, authLoading, enabled, loadAll]);

  useEffect(() => {
    if (!userId || authLoading || !enabled) return;

    const tick = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      void loadAll("poll");
    };

    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [userId, authLoading, enabled, loadAll]);

  return {
    leads,
    setLeads,
    error,
    loading,
    refreshing,
    loadAll: () => loadAll("manual"),
  };
}
