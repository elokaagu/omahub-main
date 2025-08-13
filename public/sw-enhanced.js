// Phase 2C: Enhanced Service Worker with Intelligent Caching
// OmaHub Premium Performance Service Worker

const CACHE_VERSION = "2.0.0";
const CACHE_NAMES = {
  STATIC: "omahub-static-v2",
  IMAGES: "omahub-images-v2",
  API: "omahub-api-v2",
  FONTS: "omahub-fonts-v2",
  RUNTIME: "omahub-runtime-v2",
  OFFLINE: "omahub-offline-v2",
};

const CACHE_STRATEGIES = {
  CACHE_FIRST: "cache-first",
  NETWORK_FIRST: "network-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
  NETWORK_ONLY: "network-only",
};

// Performance monitoring
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineRequests: 0,
  startTime: Date.now(),
};

// Intelligent cache management
class IntelligentCacheManager {
  constructor() {
    this.cachePriorities = new Map();
    this.accessPatterns = new Map();
  }

  async getCacheStrategy(request) {
    const url = new URL(request.url);

    // Static assets - cache first
    if (this.isStaticAsset(url)) {
      return CACHE_STRATEGIES.CACHE_FIRST;
    }

    // Images - stale while revalidate
    if (this.isImage(url)) {
      return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
    }

    // API calls - network first with fallback
    if (this.isAPI(url)) {
      return CACHE_STRATEGIES.NETWORK_FIRST;
    }

    // Fonts - cache first
    if (this.isFont(url)) {
      return CACHE_STRATEGIES.CACHE_FIRST;
    }

    // Default - network first
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  isStaticAsset(url) {
    return /\.(js|css|woff2|woff|ttf|eot)$/i.test(url.pathname);
  }

  isImage(url) {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(url.pathname);
  }

  isAPI(url) {
    return (
      url.pathname.startsWith("/api/") || url.pathname.includes("supabase")
    );
  }

  isFont(url) {
    return /\.(woff2|woff|ttf|eot|otf)$/i.test(url.pathname);
  }

  async updateAccessPattern(key) {
    const now = Date.now();
    const pattern = this.accessPatterns.get(key) || {
      count: 0,
      lastAccess: now,
    };
    pattern.count++;
    pattern.lastAccess = now;
    this.accessPatterns.set(key, pattern);
  }

  getCachePriority(key) {
    const pattern = this.accessPatterns.get(key);
    if (!pattern) return "low";

    if (pattern.count > 10) return "high";
    if (pattern.count > 5) return "medium";
    return "low";
  }
}

const cacheManager = new IntelligentCacheManager();

// Service Worker Installation
self.addEventListener("install", (event) => {
  console.log("🚀 OmaHub Service Worker installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAMES.STATIC)
      .then((cache) => {
        console.log("📦 Static cache opened");
        return cache.addAll(["/", "/offline", "/manifest.json"]);
      })
      .then(() => {
        console.log("✅ Service Worker installed successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Service Worker installation failed:", error);
      })
  );
});

// Service Worker Activation
self.addEventListener("activate", (event) => {
  console.log("🔄 OmaHub Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("✅ Service Worker activated successfully");
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("❌ Service Worker activation failed:", error);
      })
  );
});

// Fetch Event Handler with Intelligent Caching
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  event.respondWith(
    handleFetchWithIntelligentCaching(request).catch((error) => {
      console.error("❌ Fetch failed:", error);
      return handleOfflineFallback(request);
    })
  );
});

// Intelligent Caching Strategy
async function handleFetchWithIntelligentCaching(request) {
  const strategy = await cacheManager.getCacheStrategy(request);
  const cacheKey = `${request.url}-${strategy}`;

  await cacheManager.updateAccessPattern(cacheKey);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return handleCacheFirst(request);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return handleNetworkFirst(request);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return handleStaleWhileRevalidate(request);

    default:
      return handleNetworkFirst(request);
  }
}

// Cache First Strategy
async function handleCacheFirst(request) {
  const cache = await caches.open(CACHE_NAMES.STATIC);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }

  performanceMetrics.cacheMisses++;
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const responseClone = networkResponse.clone();
    cache.put(request, responseClone);
  }

  return networkResponse;
}

// Network First Strategy
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    performanceMetrics.networkRequests++;

    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      const cache = await getAppropriateCache(request);
      cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    console.log("🌐 Network failed, trying cache for:", request.url);
    return handleCacheFallback(request);
  }
}

// Stale While Revalidate Strategy
async function handleStaleWhileRevalidate(request) {
  const cache = await getAppropriateCache(request);
  const cachedResponse = await cache.match(request);

  // Return cached response immediately if available
  if (cachedResponse) {
    performanceMetrics.cacheHits++;

    // Trigger background refresh
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          cache.put(request, responseClone);
        }
      })
      .catch((error) => {
        console.warn("Background refresh failed:", error);
      });

    return cachedResponse;
  }

  // No cache, fetch fresh
  performanceMetrics.cacheMisses++;
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const responseClone = networkResponse.clone();
    cache.put(request, responseClone);
  }

  return networkResponse;
}

// Cache Fallback
async function handleCacheFallback(request) {
  const cache = await getAppropriateCache(request);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }

  performanceMetrics.offlineRequests++;
  return handleOfflineFallback(request);
}

// Get Appropriate Cache
async function getAppropriateCache(request) {
  const url = new URL(request.url);

  if (cacheManager.isImage(url)) {
    return caches.open(CACHE_NAMES.IMAGES);
  }

  if (cacheManager.isAPI(url)) {
    return caches.open(CACHE_NAMES.API);
  }

  if (cacheManager.isFont(url)) {
    return caches.open(CACHE_NAMES.FONTS);
  }

  return caches.open(CACHE_NAMES.STATIC);
}

// Offline Fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);

  // Return offline page for navigation requests
  if (request.mode === "navigate") {
    const offlineCache = await caches.open(CACHE_NAMES.OFFLINE);
    const offlineResponse = await offlineCache.match("/offline");

    if (offlineResponse) {
      return offlineResponse;
    }
  }

  // Return default offline response
  return new Response(
    JSON.stringify({
      error: "Offline",
      message: "This resource is not available offline",
      url: request.url,
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    }
  );
}

// Background Sync
self.addEventListener("sync", (event) => {
  console.log("🔄 Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  try {
    // Sync offline actions
    const offlineActions = await getOfflineActions();

    for (const action of offlineActions) {
      try {
        await performOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error("Background sync failed for action:", action, error);
      }
    }

    console.log("✅ Background sync completed");
  } catch (error) {
    console.error("❌ Background sync failed:", error);
  }
}

// Push Notifications
self.addEventListener("push", (event) => {
  console.log("📱 Push notification received");

  const options = {
    body: event.data ? event.data.text() : "New update from OmaHub",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Explore",
        icon: "/icons/icon-72x72.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/icon-72x72.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("OmaHub", options));
});

// Notification Click
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notification clicked:", event.action);

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Message Handler
self.addEventListener("message", (event) => {
  console.log("💬 Message received:", event.data);

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      timestamp: Date.now(),
      metrics: performanceMetrics,
    });
  }

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_METRICS") {
    event.ports[0].postMessage({
      metrics: performanceMetrics,
      uptime: Date.now() - performanceMetrics.startTime,
    });
  }
});

// Utility Functions
async function getOfflineActions() {
  // Implementation for retrieving offline actions
  return [];
}

async function performOfflineAction(action) {
  // Implementation for performing offline actions
  console.log("Performing offline action:", action);
}

async function removeOfflineAction(actionId) {
  // Implementation for removing completed offline actions
  console.log("Removing offline action:", actionId);
}

// Performance Monitoring
setInterval(() => {
  console.log("📊 Service Worker Metrics:", {
    cacheHits: performanceMetrics.cacheHits,
    cacheMisses: performanceMetrics.cacheMisses,
    hitRate:
      performanceMetrics.cacheHits /
      (performanceMetrics.cacheHits + performanceMetrics.cacheMisses),
    networkRequests: performanceMetrics.networkRequests,
    offlineRequests: performanceMetrics.offlineRequests,
    uptime: Date.now() - performanceMetrics.startTime,
  });
}, 60000); // Log every minute

console.log("🚀 OmaHub Enhanced Service Worker loaded successfully");
console.log("📱 Version:", CACHE_VERSION);
console.log("🎯 Intelligent caching strategies enabled");
console.log("📊 Performance monitoring active");

