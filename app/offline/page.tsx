"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Home,
  Package,
  Users,
  MessageSquare,
} from "@/lib/utils/iconImports";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Connectivity = "unknown" | "online" | "offline";

type ServiceWorkerMeta = {
  version: string;
  /** When the service worker replied (not a content sync time). */
  respondedAt: Date;
};

export default function OfflinePage() {
  const [connectivity, setConnectivity] = useState<Connectivity>("unknown");
  const [swMeta, setSwMeta] = useState<ServiceWorkerMeta | null>(null);
  const [connectionHint, setConnectionHint] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [swAdvanceHint, setSwAdvanceHint] = useState<string | null>(null);
  const [swEnvAvailable, setSwEnvAvailable] = useState(false);

  const applyNavigatorStatus = useCallback(() => {
    const online = navigator.onLine;
    setConnectivity(online ? "online" : "offline");
    if (online) setConnectionHint(null);
  }, []);

  useEffect(() => {
    setSwEnvAvailable(
      typeof navigator !== "undefined" && "serviceWorker" in navigator
    );
    applyNavigatorStatus();

    window.addEventListener("online", applyNavigatorStatus);
    window.addEventListener("offline", applyNavigatorStatus);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (!registration.active) return;

        const channel = new MessageChannel();
        channel.port1.onmessage = (event: MessageEvent) => {
          const data = event.data as {
            version?: string;
            timestamp?: number;
          };
          if (data?.version != null && typeof data.timestamp === "number") {
            setSwMeta({
              version: String(data.version),
              respondedAt: new Date(data.timestamp),
            });
          }
        };
        registration.active.postMessage({ type: "GET_VERSION" }, [
          channel.port2,
        ]);
      });
    }

    return () => {
      window.removeEventListener("online", applyNavigatorStatus);
      window.removeEventListener("offline", applyNavigatorStatus);
    };
  }, [applyNavigatorStatus]);

  const handleRefresh = () => {
    window.location.reload();
  };

  /**
   * Tell a *waiting* service worker to call skipWaiting() (see `public/sw-enhanced.js`).
   * This does not test the network—it only applies a queued worker update, if any.
   */
  const handleApplyPendingWorkerUpdate = async () => {
    setSwAdvanceHint(null);
    if (!("serviceWorker" in navigator)) {
      setSwAdvanceHint(
        "Service workers are not available in this browser or context."
      );
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setSwAdvanceHint("No service worker is registered for this site.");
        return;
      }
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        setSwAdvanceHint(
          "Pending update applied. Reload the page to run the new version."
        );
        return;
      }
      if (reg.installing) {
        setSwAdvanceHint(
          "An update is still installing. Wait a few seconds, then try again or refresh."
        );
        return;
      }
      setSwAdvanceHint(
        "No queued worker update. If content looks old, use “Refresh page”."
      );
    } catch {
      setSwAdvanceHint("Could not reach the service worker. Try a normal refresh.");
    }
  };

  /**
   * Re-check connectivity: browser signal + lightweight same-origin request.
   * (Does not post SKIP_WAITING—that is for activating a waiting worker, not for reachability.)
   */
  const handleRetryConnection = async () => {
    setConnectionHint(null);
    setIsChecking(true);
    try {
      applyNavigatorStatus();

      if (!navigator.onLine) {
        setConnectivity("offline");
        setConnectionHint(
          "Your browser still reports no connection. Check Wi‑Fi or mobile data."
        );
        return;
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(`${window.location.origin}/api/health`, {
          method: "GET",
          mode: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        setConnectivity("online");
        setConnectionHint(
          res.ok
            ? "We can reach OmaHub. Refresh the page for the latest content."
            : "You're online, but the app returned an error. Try refreshing or try again later."
        );
      } catch {
        setConnectivity("offline");
        setConnectionHint(
          "We still can't reach the server. You may be on a captive portal or offline."
        );
      } finally {
        window.clearTimeout(timeoutId);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const isOnline = connectivity === "online";
  const isUnknown = connectivity === "unknown";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mb-6">
          {isUnknown ? (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <RefreshCw
                className="h-9 w-9 animate-spin text-slate-500"
                aria-hidden
              />
            </div>
          ) : isOnline ? (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Wifi className="h-10 w-10 text-green-600" aria-hidden />
            </div>
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <WifiOff className="h-10 w-10 text-red-600" aria-hidden />
            </div>
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {isUnknown
            ? "Checking connection…"
            : isOnline
              ? "Back online"
              : "You're offline"}
        </h1>

        <p className="mb-6 text-gray-600">
          {isUnknown
            ? "Hang on while we detect your network status."
            : isOnline
              ? "You're connected again. Refresh to load the latest content."
              : "Some pages you opened before may still work from cache. Live data needs a connection."}
        </p>

        {swMeta && (
          <div className="mb-6 rounded-lg bg-slate-50 p-4 text-left text-sm text-slate-700">
            <p className="font-medium text-slate-800">Offline helper</p>
            <p className="mt-1">
              Version <span className="font-mono">{swMeta.version}</span>
            </p>
            <p className="mt-1 text-slate-600">
              Last ping:{" "}
              {swMeta.respondedAt.toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              This is when the service worker responded, not when your data last
              synced.
            </p>
          </div>
        )}

        {connectionHint && (
          <p
            className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900"
            role="status"
          >
            {connectionHint}
          </p>
        )}

        <div className="space-y-3">
          {isOnline ? (
            <Button
              type="button"
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-5 w-5" />
              Refresh page
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={handleRetryConnection}
              disabled={isChecking}
            >
              <Wifi className="h-5 w-5" />
              {isChecking ? "Checking…" : "Retry connection"}
            </Button>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="flex flex-col items-center rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
            >
              <Home className="mb-2 h-6 w-6 text-gray-600" />
              <span className="text-sm text-gray-700">Home</span>
            </Link>

            <Link
              href="/collections"
              className="flex flex-col items-center rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
            >
              <Package className="mb-2 h-6 w-6 text-gray-600" />
              <span className="text-sm text-gray-700">Collections</span>
            </Link>

            <Link
              href="/tailors"
              className="flex flex-col items-center rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
            >
              <Users className="mb-2 h-6 w-6 text-gray-600" />
              <span className="text-sm text-gray-700">Tailors</span>
            </Link>

            <Link
              href="/contact"
              className="flex flex-col items-center rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
            >
              <MessageSquare className="mb-2 h-6 w-6 text-gray-600" />
              <span className="text-sm text-gray-700">Contact</span>
            </Link>
          </div>
        </div>

        {!isOnline && !isUnknown && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-left">
            <h3 className="mb-2 font-semibold text-green-800">
              What may work offline
            </h3>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• This page and the app shell (if cached by your device)</li>
              <li>
                • Pages you visited recently might open from cache—images and
                API data are not guaranteed
              </li>
              <li>
                • Signing in, favourites, and fresh listings need a connection
              </li>
            </ul>
          </div>
        )}

        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isUnknown && "animate-pulse bg-slate-400",
                connectivity === "online" && "bg-green-500",
                connectivity === "offline" && "bg-red-500"
              )}
              aria-hidden
            />
            {isUnknown
              ? "Checking…"
              : isOnline
                ? "Connected"
                : "Offline"}
          </div>
        </div>

        {swEnvAvailable && (
          <details className="mt-6 rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-left text-sm text-gray-600">
            <summary className="cursor-pointer font-medium text-gray-800">
              Advanced: app update (service worker)
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              If OmaHub released a new offline cache version, you can ask a{" "}
              <em>waiting</em> worker to activate. This is not a connection
              check—use &quot;Retry connection&quot; for that.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full border-gray-300"
              onClick={handleApplyPendingWorkerUpdate}
            >
              Apply pending update
            </Button>
            {swAdvanceHint && (
              <p className="mt-2 text-xs text-gray-700" role="status">
                {swAdvanceHint}
              </p>
            )}
          </details>
        )}
      </div>
    </div>
  );
}
