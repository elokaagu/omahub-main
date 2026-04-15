"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lead, LeadStats } from "./types";
import { EMPTY_LEAD_STATS, normalizeLeads } from "./types";

const POLL_MS = 60_000;

type LoadReason = "initial" | "manual" | "poll";

export function useStudioLeads(options: {
  userId: string | null | undefined;
  authLoading: boolean;
}) {
  const { userId, authLoading } = options;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats>(EMPTY_LEAD_STATS);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsRefreshing, setStatsRefreshing] = useState(false);

  const loadBatchSeqRef = useRef(0);
  const statsOnlySeqRef = useRef(0);
  const hasCompletedInitialLoadRef = useRef(false);

  const fetchLeadsList = useCallback(async (): Promise<Lead[]> => {
    const response = await fetch(
      `/api/leads?action=list&page=1&limit=100&_t=${Date.now()}`,
      {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        typeof errorData.error === "string"
          ? errorData.error
          : "Failed to load leads"
      );
    }
    const result = await response.json();
    return normalizeLeads(result.leads);
  }, []);

  const fetchLeadStats = useCallback(async (): Promise<LeadStats | null> => {
    const response = await fetch(`/api/leads?action=analytics&_t=${Date.now()}`, {
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.analytics ?? null;
  }, []);

  const loadAll = useCallback(
    async (reason: LoadReason = "initial") => {
      if (!userId) return;

      const seq = ++loadBatchSeqRef.current;
      const isStale = () => seq !== loadBatchSeqRef.current;

      if (reason === "manual" || reason === "initial") {
        setLeadsError(null);
      }

      const hasData = hasCompletedInitialLoadRef.current;
      if (!hasData) {
        setLoading(true);
      } else if (reason === "manual") {
        setRefreshing(true);
      }

      try {
        const [leadsOutcome, statsOutcome] = await Promise.allSettled([
          fetchLeadsList(),
          fetchLeadStats(),
        ]);

        if (isStale()) return;

        if (leadsOutcome.status === "fulfilled") {
          setLeads(leadsOutcome.value);
          setLeadsError(null);
        } else {
          console.error("Error loading leads:", leadsOutcome.reason);
          const msg =
            leadsOutcome.reason instanceof Error
              ? leadsOutcome.reason.message
              : "Failed to load leads";
          setLeadsError(msg);
        }

        if (statsOutcome.status === "fulfilled" && statsOutcome.value) {
          setLeadStats(statsOutcome.value);
          setStatsError(null);
        } else {
          setStatsError("Analytics could not be loaded. Try refreshing.");
          if (statsOutcome.status === "rejected") {
            console.error("Error loading lead stats:", statsOutcome.reason);
          }
        }
      } finally {
        if (!isStale()) {
          setLoading(false);
          setRefreshing(false);
          hasCompletedInitialLoadRef.current = true;
        }
      }
    },
    [userId, fetchLeadsList, fetchLeadStats]
  );

  const refreshStats = useCallback(async () => {
    if (!userId) return;
    const seq = ++statsOnlySeqRef.current;
    const isStale = () => seq !== statsOnlySeqRef.current;
    setStatsRefreshing(true);
    try {
      const stats = await fetchLeadStats();
      if (isStale()) return;
      if (stats) {
        setLeadStats(stats);
        setStatsError(null);
      } else {
        setStatsError("Analytics could not be loaded.");
      }
    } catch (e) {
      if (!isStale()) {
        console.error("Error loading lead stats:", e);
        setStatsError("Analytics could not be loaded.");
      }
    } finally {
      if (!isStale()) setStatsRefreshing(false);
    }
  }, [userId, fetchLeadStats]);

  useEffect(() => {
    if (!userId || authLoading) return;
    void loadAll("initial");
  }, [userId, authLoading, loadAll]);

  useEffect(() => {
    if (!userId || authLoading) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void loadAll("poll");
    };

    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [userId, authLoading, loadAll]);

  return {
    leads,
    setLeads,
    leadStats,
    statsError,
    leadsError,
    loading,
    refreshing,
    loadAll: () => loadAll("manual"),
    refreshStats,
    statsRefreshing,
  };
}
