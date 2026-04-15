"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StudioInquiry, StudioNotification } from "./types";

const POLL_MS = 60_000;
const isDev = process.env.NODE_ENV === "development";

type LoadReason = "initial" | "manual" | "interval";

export function useStudioInbox(options: {
  userId: string | null | undefined;
  authLoading: boolean;
  pausePolling: boolean;
}) {
  const { userId, authLoading, pausePolling } = options;

  const [inquiries, setInquiries] = useState<StudioInquiry[]>([]);
  const [notifications, setNotifications] = useState<StudioNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const firstFetchFinishedRef = useRef(false);

  const loadInbox = useCallback(
    async (reason: LoadReason = "initial") => {
      if (!userId) return;

      const rid = ++requestIdRef.current;
      const isStale = () => rid !== requestIdRef.current;

      const hasContent = firstFetchFinishedRef.current;

      if (!hasContent) {
        setLoading(true);
      } else if (reason === "manual") {
        setRefreshing(true);
      }

      if (reason === "initial" || reason === "manual") {
        setLoadError(null);
      }

      try {
        const response = await fetch(`/api/studio/inbox?_t=${Date.now()}`, {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (isStale()) return;

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setInquiries([]);
            setNotifications([]);
            setLoadError(null);
            return;
          }
          throw new Error("Failed to load inbox");
        }

        const data = await response.json();
        if (isStale()) return;

        setInquiries(data.inquiries || []);
        setNotifications(data.notifications || []);
        setLoadError(null);
      } catch (e) {
        if (isStale()) return;
        if (isDev) {
          console.error("Error loading inbox:", e);
        }
        setLoadError("We couldn’t load your inbox. Check your connection and try again.");
      } finally {
        if (!isStale()) {
          setLoading(false);
          setRefreshing(false);
          firstFetchFinishedRef.current = true;
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!userId || authLoading) return;
    void loadInbox("initial");
  }, [userId, authLoading, loadInbox]);

  useEffect(() => {
    if (!userId || authLoading) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (pausePolling) return;
      void loadInbox("interval");
    };

    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [userId, authLoading, pausePolling, loadInbox]);

  return {
    inquiries,
    setInquiries,
    notifications,
    setNotifications,
    loading,
    refreshing,
    loadError,
    loadInbox: () => loadInbox("manual"),
  };
}
