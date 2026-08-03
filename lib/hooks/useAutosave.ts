"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface UseAutosaveOptions<T> {
  /** Current form/data value to watch */
  data: T;
  /** Persist to Supabase (or other backend) */
  onSave: (data: T) => Promise<void>;
  /** Skip autosave until true (e.g. after initial load) */
  enabled?: boolean;
  debounceMs?: number;
  /** Return true to skip saving (e.g. empty required fields) */
  shouldSkip?: (data: T) => boolean;
  /** Server-loaded baseline — updates the saved snapshot without triggering save */
  baseline?: T;
}

function shallowEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Debounced autosave for Studio forms. Watches `data`, saves after idle
 * period, and tracks pending/saving/saved/error state for UI feedback.
 */
export function useAutosave<T>({
  data,
  onSave,
  enabled = true,
  debounceMs = 1000,
  shouldSkip,
  baseline,
}: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const savedRef = useRef<T>(data);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const onSaveRef = useRef(onSave);

  onSaveRef.current = onSave;

  useEffect(() => {
    if (baseline !== undefined) {
      savedRef.current = baseline;
      setStatus("idle");
    }
  }, [baseline]);

  const saveNow = useCallback(async () => {
    if (!enabled || shouldSkip?.(data)) return;
    if (shallowEqual(data, savedRef.current)) return;

    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }

    savingRef.current = true;
    setStatus("saving");

    try {
      await onSaveRef.current(data);
      savedRef.current = data;
      setLastSavedAt(new Date());
      setStatus("saved");
    } catch (error) {
      console.error("Autosave failed:", error);
      setStatus("error");
    } finally {
      savingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        void saveNow();
      }
    }
  }, [data, enabled, shouldSkip]);

  useEffect(() => {
    if (!enabled) return;

    if (shouldSkip?.(data)) {
      setStatus("idle");
      return;
    }

    if (shallowEqual(data, savedRef.current)) return;

    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled, debounceMs, saveNow, shouldSkip]);

  return { status, lastSavedAt, saveNow };
}
