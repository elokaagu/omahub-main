"use client";



import { useEffect, useState } from "react";
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

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Check online status
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Listen for online/offline events
    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);

    // Check initial status
    checkOnlineStatus();

    // Get last sync time from service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            if (event.data && event.data.timestamp) {
              setLastSync(new Date(event.data.timestamp));
            }
          };
          registration.active.postMessage({ type: "GET_VERSION" }, [
            channel.port2,
          ]);
        }
      });
    }

    return () => {
      window.removeEventListener("online", checkOnlineStatus);
      window.removeEventListener("offline", checkOnlineStatus);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoOnline = () => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {isOnline ? (
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Wifi className="w-10 h-10 text-green-600" />
            </div>
          ) : (
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-red-600" />
            </div>
          )}
        </div>

        {/* Status Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isOnline ? "Back Online!" : "You're Offline"}
        </h1>

        <p className="text-gray-600 mb-6">
          {isOnline
            ? "Great! You're connected again. Refresh to get the latest content."
            : "Don't worry! You can still access your cached content and use OmaHub offline."}
        </p>

        {/* Last Sync Info */}
        {lastSync && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Last synced: {lastSync.toLocaleString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {isOnline ? (
            <button
              onClick={handleRefresh}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Page
            </button>
          ) : (
            <button
              onClick={handleGoOnline}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Wifi className="w-5 h-5" />
              Check Connection
            </button>
          )}

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Link
              href="/"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="w-6 h-6 text-gray-600 mb-2" />
              <span className="text-sm text-gray-700">Home</span>
            </Link>

            <Link
              href="/collections"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Package className="w-6 h-6 text-gray-600 mb-2" />
              <span className="text-sm text-gray-700">Collections</span>
            </Link>

            <Link
              href="/tailors"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="w-6 h-6 text-gray-600 mb-2" />
              <span className="text-sm text-gray-700">Tailors</span>
            </Link>

            <Link
              href="/contact"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MessageSquare className="w-6 h-6 text-gray-600 mb-2" />
              <span className="text-sm text-gray-700">Contact</span>
            </Link>
          </div>
        </div>

        {/* Offline Features Info */}
        {!isOnline && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              Available Offline:
            </h3>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• Browse cached collections and products</li>
              <li>• View saved favorites</li>
              <li>• Access brand information</li>
              <li>• View tailor portfolios</li>
            </ul>
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
            ></div>
            {isOnline ? "Connected" : "Offline Mode"}
          </div>
        </div>
      </div>
    </div>
  );
}
