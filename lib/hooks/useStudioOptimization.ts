import { useCallback, useRef, useEffect } from "react";

interface UseStudioOptimizationOptions {
  debounceMs?: number;
  maxRefreshIntervalMs?: number;
  enableRealTimeUpdates?: boolean;
}

/**
 * Custom hook to optimize Studio performance and prevent unnecessary reloads
 * This hook provides debounced and controlled data fetching to reduce constant reloading
 */
export function useStudioOptimization(
  options: UseStudioOptimizationOptions = {}
) {
  const {
    debounceMs = 500,
    maxRefreshIntervalMs = 30000, // 30 seconds max
    enableRealTimeUpdates = true,
  } = options;

  const lastFetchTime = useRef<number>(0);
  const pendingFetch = useRef<NodeJS.Timeout | null>(null);
  const isFetching = useRef<boolean>(false);
  const fetchCount = useRef<number>(0);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    (fetchFunction: () => Promise<void>, force = false) => {
      const now = Date.now();

      // If force is true, fetch immediately
      if (force) {
        if (pendingFetch.current) {
          clearTimeout(pendingFetch.current);
          pendingFetch.current = null;
        }
        fetchFunction();
        return;
      }

      // Check if we're already fetching
      if (isFetching.current) {
        console.log("🔄 Studio: Fetch already in progress, skipping...");
        return;
      }

      // Check if we've fetched too recently
      if (now - lastFetchTime.current < maxRefreshIntervalMs) {
        console.log("⏳ Studio: Fetch throttled, too recent...");
        return;
      }

      // Clear any pending fetch
      if (pendingFetch.current) {
        clearTimeout(pendingFetch.current);
      }

      // Set up debounced fetch
      pendingFetch.current = setTimeout(() => {
        pendingFetch.current = null;
        fetchFunction();
      }, debounceMs);
    },
    [debounceMs, maxRefreshIntervalMs]
  );

  // Controlled refresh function
  const controlledRefresh = useCallback(
    (fetchFunction: () => Promise<void>) => {
      const now = Date.now();

      // Always allow forced refresh
      if (now - lastFetchTime.current > maxRefreshIntervalMs) {
        fetchFunction();
      } else {
        console.log(
          "⏳ Studio: Refresh throttled, use force refresh if needed"
        );
      }
    },
    [maxRefreshIntervalMs]
  );

  // Force refresh function
  const forceRefresh = useCallback((fetchFunction: () => Promise<void>) => {
    console.log("🔄 Studio: Force refresh requested");
    lastFetchTime.current = 0; // Reset timer
    fetchFunction();
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pendingFetch.current) {
      clearTimeout(pendingFetch.current);
      pendingFetch.current = null;
    }
    isFetching.current = false;
  }, []);

  // Track fetch operations
  const trackFetch = useCallback(
    async <T>(
      fetchFunction: () => Promise<T>,
      options: { force?: boolean; track?: boolean } = {}
    ) => {
      const { force = false, track = true } = options;

      if (force) {
        lastFetchTime.current = 0;
      }

      try {
        isFetching.current = true;
        if (track) {
          fetchCount.current++;
          console.log(`🔄 Studio: Fetch #${fetchCount.current} starting...`);
        }

        const result = await fetchFunction();

        if (track) {
          console.log(`✅ Studio: Fetch #${fetchCount.current} completed`);
        }

        lastFetchTime.current = Date.now();
        return result;
      } catch (error) {
        if (track) {
          console.error(
            `❌ Studio: Fetch #${fetchCount.current} failed:`,
            error
          );
        }
        throw error;
      } finally {
        isFetching.current = false;
      }
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    debouncedFetch,
    controlledRefresh,
    forceRefresh,
    trackFetch,
    cleanup,
    isFetching: isFetching.current,
    lastFetchTime: lastFetchTime.current,
    fetchCount: fetchCount.current,
  };
}

/**
 * Hook to prevent excessive re-renders in Studio components
 */
export function useStudioStableState<T>(
  initialState: T,
  options: {
    maxUpdatesPerSecond?: number;
    enableStableReferences?: boolean;
  } = {}
) {
  const { maxUpdatesPerSecond = 2, enableStableReferences = true } = options;

  const lastUpdateTime = useRef<number>(0);
  const updateCount = useRef<number>(0);
  const stableRef = useRef<T>(initialState);

  const setStableState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime.current;

      // Throttle updates
      if (timeSinceLastUpdate < 1000 / maxUpdatesPerSecond) {
        console.log("⏳ Studio: State update throttled for performance");
        return;
      }

      // Update the stable reference
      if (typeof newState === "function") {
        stableRef.current = (newState as (prev: T) => T)(stableRef.current);
      } else {
        stableRef.current = newState;
      }

      lastUpdateTime.current = now;
      updateCount.current++;
    },
    [maxUpdatesPerSecond]
  );

  return {
    state: stableRef.current,
    setState: setStableState,
    updateCount: updateCount.current,
    lastUpdateTime: lastUpdateTime.current,
  };
}
