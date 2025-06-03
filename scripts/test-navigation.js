/**
 * Navigation Test Script
 *
 * This script can be run in the browser console to test navigation
 * and identify potential stuck states.
 */

function testNavigation() {
  console.log("🧪 Starting Navigation Test...");

  // Test 1: Check if NavigationContext is available
  try {
    const navigationContext = window.React?.useContext?.();
    console.log("✅ React context system available");
  } catch (error) {
    console.warn("⚠️ React context system not accessible from console");
  }

  // Test 2: Check current navigation state
  const currentPath = window.location.pathname;
  console.log("📍 Current path:", currentPath);

  // Test 3: Check for stuck loading states
  const loadingElements = document.querySelectorAll(
    '[data-loading="true"], .animate-spin'
  );
  if (loadingElements.length > 0) {
    console.warn("⚠️ Found", loadingElements.length, "loading elements");
    loadingElements.forEach((el, index) => {
      console.log(`Loading element ${index + 1}:`, el);
    });
  } else {
    console.log("✅ No stuck loading elements found");
  }

  // Test 4: Check for navigation debug component
  const debugComponent = document.querySelector('[class*="NavigationDebug"]');
  if (debugComponent) {
    console.log("✅ Navigation debug component found");
  } else {
    console.log(
      "ℹ️ Navigation debug component not visible (normal in production)"
    );
  }

  // Test 5: Simulate navigation test
  console.log("🔗 Testing programmatic navigation...");

  // Store original pushState
  const originalPushState = window.history.pushState;
  let navigationCount = 0;

  // Monitor navigation events
  window.history.pushState = function (...args) {
    navigationCount++;
    console.log(`📊 Navigation event ${navigationCount}:`, args[2]);
    return originalPushState.apply(this, args);
  };

  // Test navigation to current page (should be instant)
  const testLink = document.createElement("a");
  testLink.href = currentPath;
  testLink.click();

  // Restore original pushState after a delay
  setTimeout(() => {
    window.history.pushState = originalPushState;
    console.log("🏁 Navigation test completed");
    console.log("📊 Total navigation events captured:", navigationCount);
  }, 1000);
}

// Auto-run if in development
if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  console.log("🔧 Development environment detected");
  console.log("💡 Run testNavigation() to test navigation system");

  // Make function globally available
  window.testNavigation = testNavigation;
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = { testNavigation };
}
