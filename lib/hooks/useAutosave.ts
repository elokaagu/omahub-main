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

/** Structural snapshot used to compare drafts (deep, via JSON). */
function snapshot<T>(value: T): string {
  return JSON.stringify(value);
}

/**
 * Debounced autosave for Studio forms. Watches `data`, saves after idle
 * period, and tracks pending/saving/saved/error state for UI feedback.
 *
 * All callbacks read the latest values through refs, so:
 * - an edit made while a save is in flight is saved afterwards (not dropped);
 * - callers don't need to memoise `onSave` / `shouldSkip`.
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

  const dataKey = snapshot(data);
  const baselineKey = baseline === undefined ? undefined : snapshot(baseline);

  const dataRef = useRef(data);
  dataRef.current = data;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const shouldSkipRef = useRef(shouldSkip);
  shouldSkipRef.current = shouldSkip;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const savedKeyRef = useRef<string>(dataKey);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);

  useEffect(() => {
    if (baselineKey === undefined) return;
    savedKeyRef.current = baselineKey;
    if (!savingRef.current) setStatus("idle");
  }, [baselineKey]);

  const saveNow = useCallback(async (): Promise<void> => {
    if (!enabledRef.current) return;
    const current = dataRef.current;
    if (shouldSkipRef.current?.(current)) return;
    const key = snapshot(current);
    if (key === savedKeyRef.current) return;

    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }

    savingRef.current = true;
    setStatus("saving");

    try {
      await onSaveRef.current(current);
      savedKeyRef.current = key;
      setLastSavedAt(new Date());
      setStatus(snapshot(dataRef.current) === key ? "saved" : "pending");
    } catch (error) {
      console.error("Autosave failed:", error);
      setStatus("error");
    } finally {
      savingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        // Reads dataRef, so this saves the newest edit rather than a stale copy.
        void saveNow();
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (shouldSkipRef.current?.(dataRef.current)) {
      setStatus("idle");
      return;
    }

    if (dataKey === savedKeyRef.current) return;

    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dataKey, enabled, debounceMs, saveNow]);

  return { status, lastSavedAt, saveNow };
}
