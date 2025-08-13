// Phase 2C: Performance Monitoring Service
// OmaHub Premium Performance Analytics

import { defaultCache, imageCache, apiCache } from "./cacheService";

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint

  // Cache Performance
  cacheHitRate: number;
  cacheSize: number;
  cacheEntries: number;

  // Service Worker Metrics
  swVersion: string;
  swUptime: number;
  swCacheHits: number;
  swCacheMisses: number;

  // Bundle Performance
  bundleSize: number;
  loadTime: number;
  resourceCount: number;

  // User Experience
  pageLoadTime: number;
  interactionDelay: number;
  offlineUsage: number;
}

export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number; poor: number };
  fid: { good: number; needsImprovement: number; poor: number };
  cls: { good: number; needsImprovement: number; poor: number };
  ttfb: { good: number; needsImprovement: number; poor: number };
}

export class PerformanceMonitoringService {
  private metrics: Partial<PerformanceMetrics> = {};
  private thresholds: PerformanceThresholds = {
    lcp: { good: 2500, needsImprovement: 4000, poor: 4000 },
    fid: { good: 100, needsImprovement: 300, poor: 300 },
    cls: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
    ttfb: { good: 800, needsImprovement: 1800, poor: 1800 },
  };

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring() {
    if (typeof window === "undefined") return;

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();

    // Monitor cache performance
    this.monitorCachePerformance();

    // Monitor service worker
    this.monitorServiceWorker();

    // Monitor bundle performance
    this.monitorBundlePerformance();

    // Monitor user interactions
    this.monitorUserInteractions();

    // Periodic reporting
    this.startPeriodicReporting();
  }

  /**
   * Monitor Core Web Vitals
   */
  private monitorCoreWebVitals() {
    if ("web-vitals" in window) {
      import("web-vitals").then(
        ({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS((metric) => {
            this.metrics.cls = metric.value;
            this.reportMetric("CLS", metric);
          });

          getFID((metric) => {
            this.metrics.fid = metric.value;
            this.reportMetric("FID", metric);
          });

          getFCP((metric) => {
            this.metrics.fcp = metric.value;
            this.reportMetric("FCP", metric);
          });

          getLCP((metric) => {
            this.metrics.lcp = metric.value;
            this.reportMetric("LCP", metric);
          });

          getTTFB((metric) => {
            this.metrics.ttfb = metric.value;
            this.reportMetric("TTFB", metric);
          });
        }
      );
    }
  }

  /**
   * Monitor cache performance
   */
  private monitorCachePerformance() {
    setInterval(() => {
      const defaultStats = defaultCache.getStats();
      const imageStats = imageCache.getStats();
      const apiStats = apiCache.getStats();

      this.metrics.cacheHitRate =
        (defaultStats.hitRate + imageStats.hitRate + apiStats.hitRate) / 3;
      this.metrics.cacheSize =
        defaultStats.totalSize + imageStats.totalSize + apiStats.totalSize;
      this.metrics.cacheEntries =
        defaultStats.totalEntries +
        imageStats.totalEntries +
        apiStats.totalEntries;

      this.reportCacheMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Monitor service worker performance
   */
  private monitorServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          this.getServiceWorkerMetrics(registration);
        }
      });

      // Listen for service worker updates
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "GET_METRICS") {
          this.metrics.swVersion = event.data.version;
          this.metrics.swUptime = event.data.uptime;
          this.metrics.swCacheHits = event.data.metrics.cacheHits;
          this.metrics.swCacheMisses = event.data.metrics.cacheMisses;
        }
      });
    }
  }

  /**
   * Get service worker metrics
   */
  private async getServiceWorkerMetrics(
    registration: ServiceWorkerRegistration
  ) {
    const channel = new MessageChannel();

    channel.port1.onmessage = (event) => {
      if (event.data && event.data.metrics) {
        this.metrics.swVersion = event.data.version;
        this.metrics.swUptime = event.data.uptime;
        this.metrics.swCacheHits = event.data.metrics.cacheHits;
        this.metrics.swCacheMisses = event.data.metrics.cacheMisses;
      }
    };

    registration.active?.postMessage({ type: "GET_METRICS" }, [channel.port2]);
  }

  /**
   * Monitor bundle performance
   */
  private monitorBundlePerformance() {
    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "resource") {
          this.metrics.resourceCount = (this.metrics.resourceCount || 0) + 1;

          if (entry.name.includes("_next/static")) {
            this.metrics.bundleSize =
              (this.metrics.bundleSize || 0) +
              (entry as PerformanceResourceTiming).transferSize;
          }
        }
      }
    });

    observer.observe({ entryTypes: ["resource"] });

    // Monitor page load time
    window.addEventListener("load", () => {
      const loadTime = performance.now();
      this.metrics.pageLoadTime = loadTime;
      this.metrics.loadTime = loadTime;
    });
  }

  /**
   * Monitor user interactions
   */
  private monitorUserInteractions() {
    let firstInteraction = true;

    const interactionHandler = () => {
      if (firstInteraction) {
        this.metrics.interactionDelay = performance.now();
        firstInteraction = false;

        // Remove listeners after first interaction
        document.removeEventListener("click", interactionHandler);
        document.removeEventListener("keydown", interactionHandler);
        document.removeEventListener("touchstart", interactionHandler);
      }
    };

    document.addEventListener("click", interactionHandler);
    document.addEventListener("keydown", interactionHandler);
    document.addEventListener("touchstart", interactionHandler);

    // Monitor offline usage
    window.addEventListener("offline", () => {
      this.metrics.offlineUsage = (this.metrics.offlineUsage || 0) + 1;
    });
  }

  /**
   * Start periodic performance reporting
   */
  private startPeriodicReporting() {
    setInterval(() => {
      this.generatePerformanceReport();
    }, 60000); // Every minute
  }

  /**
   * Report individual metric
   */
  private reportMetric(name: string, metric: any) {
    const threshold =
      this.thresholds[name.toLowerCase() as keyof PerformanceThresholds];
    if (threshold) {
      let rating = "good";
      if (metric.value > threshold.needsImprovement)
        rating = "needs-improvement";
      if (metric.value > threshold.poor) rating = "poor";

      console.log(`📊 ${name}: ${metric.value} (${rating})`);

      // Send to analytics if available
      this.sendToAnalytics(name, metric.value, rating);
    }
  }

  /**
   * Report cache metrics
   */
  private reportCacheMetrics() {
    console.log("📦 Cache Performance:", {
      hitRate: `${(this.metrics.cacheHitRate * 100).toFixed(1)}%`,
      size: `${(this.metrics.cacheSize / 1024 / 1024).toFixed(2)}MB`,
      entries: this.metrics.cacheEntries,
    });
  }

  /**
   * Generate comprehensive performance report
   */
  private generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: this.generateSummary(),
    };

    console.log("📊 Performance Report:", report);

    // Store report for analysis
    this.storePerformanceReport(report);

    // Send to external analytics if configured
    this.sendToExternalAnalytics(report);
  }

  /**
   * Generate performance summary
   */
  private generateSummary() {
    const summary = {
      overall: "good",
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Check Core Web Vitals
    if (
      this.metrics.lcp &&
      this.metrics.lcp > this.thresholds.lcp.needsImprovement
    ) {
      summary.issues.push("LCP above threshold");
      summary.recommendations.push(
        "Optimize image loading and reduce render-blocking resources"
      );
    }

    if (
      this.metrics.fid &&
      this.metrics.fid > this.thresholds.fid.needsImprovement
    ) {
      summary.issues.push("FID above threshold");
      summary.recommendations.push(
        "Reduce JavaScript execution time and optimize event handlers"
      );
    }

    if (
      this.metrics.cls &&
      this.metrics.cls > this.thresholds.cls.needsImprovement
    ) {
      summary.issues.push("CLS above threshold");
      summary.recommendations.push(
        "Avoid layout shifts and use proper image dimensions"
      );
    }

    // Check cache performance
    if (this.metrics.cacheHitRate && this.metrics.cacheHitRate < 0.7) {
      summary.issues.push("Low cache hit rate");
      summary.recommendations.push(
        "Review caching strategies and increase cache sizes"
      );
    }

    // Determine overall rating
    if (summary.issues.length > 2) summary.overall = "poor";
    else if (summary.issues.length > 0) summary.overall = "needs-improvement";

    return summary;
  }

  /**
   * Store performance report
   */
  private storePerformanceReport(report: any) {
    try {
      const reports = JSON.parse(
        localStorage.getItem("omahub-performance-reports") || "[]"
      );
      reports.push(report);

      // Keep only last 100 reports
      if (reports.length > 100) {
        reports.splice(0, reports.length - 100);
      }

      localStorage.setItem(
        "omahub-performance-reports",
        JSON.stringify(reports)
      );
    } catch (error) {
      console.warn("Failed to store performance report:", error);
    }
  }

  /**
   * Send to analytics
   */
  private sendToAnalytics(name: string, value: number, rating: string) {
    // Send to Google Analytics if available
    if (typeof gtag !== "undefined") {
      gtag("event", "performance_metric", {
        metric_name: name,
        metric_value: value,
        metric_rating: rating,
      });
    }
  }

  /**
   * Send to external analytics
   */
  private sendToExternalAnalytics(report: any) {
    // Send to external monitoring service if configured
    if (process.env.NEXT_PUBLIC_PERFORMANCE_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_PERFORMANCE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      }).catch((error) => {
        console.warn("Failed to send performance report:", error);
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getSummary() {
    return this.generateSummary();
  }

  /**
   * Get historical reports
   */
  getHistoricalReports() {
    try {
      return JSON.parse(
        localStorage.getItem("omahub-performance-reports") || "[]"
      );
    } catch {
      return [];
    }
  }

  /**
   * Clear historical data
   */
  clearHistoricalData() {
    localStorage.removeItem("omahub-performance-reports");
  }

  /**
   * Export performance data
   */
  exportData() {
    const data = {
      current: this.metrics,
      historical: this.getHistoricalReports(),
      summary: this.generateSummary(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `omahub-performance-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// Export for use in components
export default performanceMonitoring;
