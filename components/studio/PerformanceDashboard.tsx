"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Zap,
  Database,
  Monitor,
  Download,
  Clock,
  TrendingUp,
  RefreshCw,
  BarChart3,
  FileText,
  Download as DownloadIcon,
} from "@/lib/utils/iconImports";
import performanceMonitoring, {
  PerformanceMetrics,
} from "@/lib/services/performanceMonitoringService";
import {
  defaultCache,
  imageCache,
  apiCache,
} from "@/lib/services/cacheService";

interface CacheStats {
  default: any;
  image: any;
  api: any;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    default: {},
    image: {},
    api: {},
  });
  const [isOnline, setIsOnline] = useState(true);
  const [swStatus, setSwStatus] = useState<string>("unknown");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Initialize performance monitoring
    const updateMetrics = () => {
      setMetrics(performanceMonitoring.getMetrics());
      setCacheStats({
        default: defaultCache.getStats(),
        image: imageCache.getStats(),
        api: apiCache.getStats(),
      });
      setLastUpdate(new Date());
    };

    // Update immediately
    updateMetrics();

    // Update every 30 seconds
    const interval = setInterval(updateMetrics, 30000);

    // Monitor online status
    const checkOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);
    checkOnlineStatus();

    // Check service worker status
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          setSwStatus("active");
        } else {
          setSwStatus("inactive");
        }
      });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", checkOnlineStatus);
      window.removeEventListener("offline", checkOnlineStatus);
    };
  }, []);

  const getPerformanceRating = (
    metric: keyof PerformanceMetrics,
    value?: number
  ) => {
    if (!value) return "unknown";

    const thresholds = {
      lcp: { good: 2500, needsImprovement: 4000 },
      fid: { good: 100, needsImprovement: 300 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      ttfb: { good: 800, needsImprovement: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return "unknown";

    if (value <= threshold.good) return "good";
    if (value <= threshold.needsImprovement) return "needs-improvement";
    return "poor";
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "good":
        return "bg-green-500";
      case "needs-improvement":
        return "bg-yellow-500";
      case "poor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRatingText = (rating: string) => {
    switch (rating) {
      case "good":
        return "Good";
      case "needs-improvement":
        return "Needs Improvement";
      case "poor":
        return "Poor";
      default:
        return "Unknown";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const handleRefresh = () => {
    setMetrics(performanceMonitoring.getMetrics());
    setCacheStats({
      default: defaultCache.getStats(),
      image: imageCache.getStats(),
      api: apiCache.getStats(),
    });
    setLastUpdate(new Date());
  };

  const handleExportData = () => {
    performanceMonitoring.exportData();
  };

  const handleClearCache = async () => {
    await defaultCache.clear();
    await imageCache.clear();
    await apiCache.clear();
    handleRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Performance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Phase 2C: Advanced Caching & PWA Features
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-2xl font-bold">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Service Worker
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={swStatus === "active" ? "default" : "secondary"}>
                {swStatus === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cache Hit Rate
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.cacheHitRate
                ? `${(metrics.cacheHitRate * 100).toFixed(1)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.bundleSize ? formatBytes(metrics.bundleSize) : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="core-web-vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="caching">Caching</TabsTrigger>
          <TabsTrigger value="service-worker">Service Worker</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Summary</span>
                </CardTitle>
                <CardDescription>
                  Overall performance metrics and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(metrics).map(([key, value]) => {
                  if (["lcp", "fid", "cls", "ttfb"].includes(key) && value) {
                    const rating = getPerformanceRating(
                      key as keyof PerformanceMetrics,
                      typeof value === "number"
                        ? value
                        : parseFloat(value as string)
                    );
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium capitalize">
                          {key.toUpperCase()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {key === "cls"
                              ? (typeof value === "number"
                                  ? value
                                  : parseFloat(value as string)
                                ).toFixed(3)
                              : formatTime(
                                  typeof value === "number"
                                    ? value
                                    : parseFloat(value as string)
                                )}
                          </span>
                          <Badge
                            variant="outline"
                            className={getRatingColor(rating)}
                          >
                            {getRatingText(rating)}
                          </Badge>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>
                  Performance optimization tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  className="w-full"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Clear All Caches
                </Button>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Performance Data
                </Button>
                <div className="text-xs text-muted-foreground">
                  Last updated: {lastUpdate.toLocaleTimeString("en-GB")}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Core Web Vitals Tab */}
        <TabsContent value="core-web-vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                key: "lcp",
                label: "Largest Contentful Paint",
                description: "Loading performance",
              },
              {
                key: "fid",
                label: "First Input Delay",
                description: "Interactivity",
              },
              {
                key: "cls",
                label: "Cumulative Layout Shift",
                description: "Visual stability",
              },
              {
                key: "ttfb",
                label: "Time to First Byte",
                description: "Server response time",
              },
              {
                key: "fcp",
                label: "First Contentful Paint",
                description: "First content display",
              },
            ].map(({ key, label, description }) => {
              const value = metrics[key as keyof PerformanceMetrics];
              const rating = value
                ? getPerformanceRating(
                    key as keyof PerformanceMetrics,
                    typeof value === "number"
                      ? value
                      : parseFloat(value as string)
                  )
                : "unknown";

              return (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {value
                          ? key === "cls"
                            ? (typeof value === "number"
                                ? value
                                : parseFloat(value as string)
                              ).toFixed(3)
                            : formatTime(
                                typeof value === "number"
                                  ? value
                                  : parseFloat(value as string)
                              )
                          : "N/A"}
                      </span>
                      <Badge
                        variant="outline"
                        className={getRatingColor(rating)}
                      >
                        {getRatingText(rating)}
                      </Badge>
                    </div>
                    <Progress
                      value={
                        value
                          ? Math.min(
                              ((typeof value === "number"
                                ? value
                                : parseFloat(value as string)) /
                                5000) *
                                100,
                              100
                            )
                          : 0
                      }
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Caching Tab */}
        <TabsContent value="caching" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                key: "default",
                label: "Default Cache",
                stats: cacheStats.default,
              },
              { key: "image", label: "Image Cache", stats: cacheStats.image },
              { key: "api", label: "API Cache", stats: cacheStats.api },
            ].map(({ key, label, stats }) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-lg">{label}</CardTitle>
                  <CardDescription>Cache performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Hit Rate:</span>
                      <span className="font-medium">
                        {stats.hitRate
                          ? `${(stats.hitRate * 100).toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Entries:</span>
                      <span className="font-medium">
                        {stats.totalEntries || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Size:</span>
                      <span className="font-medium">
                        {stats.totalSize ? formatBytes(stats.totalSize) : "0 B"}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={stats.hitRate ? stats.hitRate * 100 : 0}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Service Worker Tab */}
        <TabsContent value="service-worker" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Service Worker Status</span>
                </CardTitle>
                <CardDescription>
                  Current service worker information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge
                      variant={swStatus === "active" ? "default" : "secondary"}
                    >
                      {swStatus === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>{metrics.swVersion || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span>
                      {metrics.swUptime ? formatTime(metrics.swUptime) : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Cache Performance</span>
                </CardTitle>
                <CardDescription>
                  Service worker cache statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cache Hits:</span>
                    <span className="font-medium">
                      {metrics.swCacheHits || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Misses:</span>
                    <span className="font-medium">
                      {metrics.swCacheMisses || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Requests:</span>
                    <span className="font-medium">
                      {(metrics.swCacheHits || 0) +
                        (metrics.swCacheMisses || 0)}
                    </span>
                  </div>
                </div>
                {metrics.swCacheHits && metrics.swCacheMisses && (
                  <Progress
                    value={
                      (metrics.swCacheHits /
                        (metrics.swCacheHits + metrics.swCacheMisses)) *
                      100
                    }
                    className="w-full"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
