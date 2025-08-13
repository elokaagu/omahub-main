#!/usr/bin/env node

// Phase 2C: Bundle Analysis Script
// OmaHub Premium Performance Bundle Analysis

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Phase 2C: OmaHub Bundle Analysis");
console.log("=====================================\n");

class Phase2CAnalyzer {
  constructor() {
    this.analysisResults = {
      bundleSize: {},
      chunkSplitting: {},
      caching: {},
      pwa: {},
      performance: {},
      recommendations: [],
    };
  }

  async analyzeBundle() {
    try {
      console.log("📊 Analyzing bundle structure...\n");

      // Check if .next directory exists
      if (!fs.existsSync(".next")) {
        console.log(
          '⚠️  .next directory not found. Please run "npm run build" first.\n'
        );
        return false;
      }

      // Analyze bundle sizes
      await this.analyzeBundleSizes();

      // Analyze chunk splitting
      await this.analyzeChunkSplitting();

      // Analyze caching strategies
      await this.analyzeCachingStrategies();

      // Analyze PWA features
      await this.analyzePWAFeatures();

      // Analyze performance targets
      await this.analyzePerformanceTargets();

      // Generate recommendations
      this.generateRecommendations();

      // Display results
      this.displayResults();

      return true;
    } catch (error) {
      console.error("❌ Analysis failed:", error.message);
      return false;
    }
  }

  async analyzeBundleSizes() {
    console.log("📦 Analyzing bundle sizes...");

    try {
      // Check for bundle analysis files
      const bundleAnalysisPath = ".next/bundle-analysis.html";
      const statsPath = ".next/bundle-stats.json";

      if (fs.existsSync(bundleAnalysisPath)) {
        console.log("✅ Bundle analysis file found");
        this.analysisResults.bundleSize.analysisFile = true;
      } else {
        console.log(
          '⚠️  Bundle analysis file not found. Run "ANALYZE=true npm run build"'
        );
        this.analysisResults.bundleSize.analysisFile = false;
      }

      if (fs.existsSync(statsPath)) {
        const stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));
        this.analysisResults.bundleSize.stats = stats;
        console.log("✅ Bundle stats file found");
      } else {
        console.log("⚠️  Bundle stats file not found");
        this.analysisResults.bundleSize.stats = null;
      }

      // Check for large files
      const largeFiles = this.findLargeFiles(".next/static/chunks");
      this.analysisResults.bundleSize.largeFiles = largeFiles;

      console.log(`📊 Found ${largeFiles.length} large chunk files\n`);
    } catch (error) {
      console.error("❌ Bundle size analysis failed:", error.message);
    }
  }

  async analyzeChunkSplitting() {
    console.log("🔀 Analyzing chunk splitting...");

    try {
      const chunksDir = ".next/static/chunks";
      if (!fs.existsSync(chunksDir)) {
        console.log("⚠️  Chunks directory not found");
        return;
      }

      const chunkFiles = fs.readdirSync(chunksDir);
      const chunkAnalysis = {
        totalChunks: chunkFiles.length,
        vendorChunks: 0,
        appChunks: 0,
        runtimeChunks: 0,
        largeChunks: 0,
      };

      chunkFiles.forEach((file) => {
        const filePath = path.join(chunksDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);

        if (file.includes("vendors")) {
          chunkAnalysis.vendorChunks++;
        } else if (file.includes("app")) {
          chunkAnalysis.appChunks++;
        } else if (file.includes("runtime")) {
          chunkAnalysis.runtimeChunks++;
        }

        if (sizeKB > 100) {
          chunkAnalysis.largeChunks++;
        }
      });

      this.analysisResults.chunkSplitting = chunkAnalysis;

      console.log(`📊 Total chunks: ${chunkAnalysis.totalChunks}`);
      console.log(`📦 Vendor chunks: ${chunkAnalysis.vendorChunks}`);
      console.log(`🚀 App chunks: ${chunkAnalysis.appChunks}`);
      console.log(`⚡ Runtime chunks: ${chunkAnalysis.runtimeChunks}`);
      console.log(`⚠️  Large chunks (>100KB): ${chunkAnalysis.largeChunks}\n`);
    } catch (error) {
      console.error("❌ Chunk splitting analysis failed:", error.message);
    }
  }

  async analyzeCachingStrategies() {
    console.log("💾 Analyzing caching strategies...");

    try {
      const cachingAnalysis = {
        serviceWorker: false,
        cacheHeaders: false,
        pwaManifest: false,
        offlineSupport: false,
      };

      // Check service worker
      if (fs.existsSync("public/sw-enhanced.js")) {
        cachingAnalysis.serviceWorker = true;
        console.log("✅ Enhanced service worker found");
      } else {
        console.log("⚠️  Enhanced service worker not found");
      }

      // Check PWA manifest
      if (fs.existsSync("public/manifest.json")) {
        cachingAnalysis.pwaManifest = true;
        console.log("✅ PWA manifest found");
      } else {
        console.log("⚠️  PWA manifest not found");
      }

      // Check offline page
      if (fs.existsSync("app/offline/page.tsx")) {
        cachingAnalysis.offlineSupport = true;
        console.log("✅ Offline page found");
      } else {
        console.log("⚠️  Offline page not found");
      }

      // Check cache service
      if (fs.existsSync("lib/services/cacheService.ts")) {
        console.log("✅ Advanced cache service found");
      } else {
        console.log("⚠️  Advanced cache service not found");
      }

      this.analysisResults.caching = cachingAnalysis;
      console.log("");
    } catch (error) {
      console.error("❌ Caching analysis failed:", error.message);
    }
  }

  async analyzePWAFeatures() {
    console.log("📱 Analyzing PWA features...");

    try {
      const pwaAnalysis = {
        manifest: false,
        serviceWorker: false,
        offlinePage: false,
        icons: false,
        shortcuts: false,
      };

      // Check manifest
      if (fs.existsSync("public/manifest.json")) {
        const manifest = JSON.parse(
          fs.readFileSync("public/manifest.json", "utf8")
        );
        pwaAnalysis.manifest = true;
        pwaAnalysis.shortcuts =
          manifest.shortcuts && manifest.shortcuts.length > 0;
        console.log("✅ PWA manifest found");
      }

      // Check service worker
      if (fs.existsSync("public/sw-enhanced.js")) {
        pwaAnalysis.serviceWorker = true;
        console.log("✅ Enhanced service worker found");
      }

      // Check offline page
      if (fs.existsSync("app/offline/page.tsx")) {
        pwaAnalysis.offlinePage = true;
        console.log("✅ Offline page found");
      }

      // Check icons
      const iconsDir = "public/icons";
      if (fs.existsSync(iconsDir)) {
        const iconFiles = fs.readdirSync(iconsDir);
        pwaAnalysis.icons = iconFiles.length >= 5;
        console.log(`✅ Icons found: ${iconFiles.length}`);
      }

      this.analysisResults.pwa = pwaAnalysis;
      console.log("");
    } catch (error) {
      console.error("❌ PWA analysis failed:", error.message);
    }
  }

  async analyzePerformanceTargets() {
    console.log("🎯 Analyzing performance targets...");

    try {
      const performanceAnalysis = {
        bundleSizeTarget: false,
        chunkSplittingTarget: false,
        cachingTarget: false,
        pwaTarget: false,
      };

      // Bundle size target: <400KB shared JavaScript
      const totalSize = this.calculateTotalBundleSize();
      performanceAnalysis.bundleSizeTarget = totalSize < 400;

      // Chunk splitting target: granular vendor splitting
      const chunkAnalysis = this.analysisResults.chunkSplitting;
      performanceAnalysis.chunkSplittingTarget =
        chunkAnalysis.vendorChunks >= 3;

      // Caching target: full offline support
      const cachingAnalysis = this.analysisResults.caching;
      performanceAnalysis.cachingTarget =
        cachingAnalysis.serviceWorker && cachingAnalysis.offlineSupport;

      // PWA target: complete PWA features
      const pwaAnalysis = this.analysisResults.pwa;
      performanceAnalysis.pwaTarget =
        pwaAnalysis.manifest &&
        pwaAnalysis.serviceWorker &&
        pwaAnalysis.offlinePage;

      this.analysisResults.performance = performanceAnalysis;

      console.log(
        `📊 Bundle size target (<400KB): ${performanceAnalysis.bundleSizeTarget ? "✅" : "❌"}`
      );
      console.log(
        `🔀 Chunk splitting target: ${performanceAnalysis.chunkSplittingTarget ? "✅" : "❌"}`
      );
      console.log(
        `💾 Caching target: ${performanceAnalysis.cachingTarget ? "✅" : "❌"}`
      );
      console.log(
        `📱 PWA target: ${performanceAnalysis.pwaTarget ? "✅" : "❌"}\n`
      );
    } catch (error) {
      console.error("❌ Performance target analysis failed:", error.message);
    }
  }

  calculateTotalBundleSize() {
    try {
      const chunksDir = ".next/static/chunks";
      if (!fs.existsSync(chunksDir)) return 0;

      let totalSize = 0;
      const chunkFiles = fs.readdirSync(chunksDir);

      chunkFiles.forEach((file) => {
        const filePath = path.join(chunksDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      return Math.round(totalSize / 1024); // Return size in KB
    } catch (error) {
      return 0;
    }
  }

  findLargeFiles(dir) {
    try {
      if (!fs.existsSync(dir)) return [];

      const files = [];
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);

        if (stats.isFile()) {
          const sizeKB = Math.round(stats.size / 1024);
          if (sizeKB > 50) {
            // Files larger than 50KB
            files.push({
              name: item,
              size: sizeKB,
              path: itemPath,
            });
          }
        }
      });

      return files.sort((a, b) => b.size - a.size);
    } catch (error) {
      return [];
    }
  }

  generateRecommendations() {
    console.log("💡 Generating recommendations...\n");

    const recommendations = [];

    // Bundle size recommendations
    if (!this.analysisResults.performance.bundleSizeTarget) {
      recommendations.push({
        priority: "HIGH",
        category: "Bundle Size",
        message:
          "Bundle size exceeds 400KB target. Consider implementing tree shaking and code splitting.",
        action:
          'Run "ANALYZE=true npm run build" to identify large dependencies',
      });
    }

    // Chunk splitting recommendations
    if (!this.analysisResults.performance.chunkSplittingTarget) {
      recommendations.push({
        priority: "MEDIUM",
        category: "Chunk Splitting",
        message:
          "Insufficient vendor chunk splitting. Implement granular vendor separation.",
        action: "Update webpack configuration in next.config.js",
      });
    }

    // Caching recommendations
    if (!this.analysisResults.performance.cachingTarget) {
      recommendations.push({
        priority: "HIGH",
        category: "Caching",
        message:
          "Offline support not fully implemented. Complete service worker and offline page.",
        action:
          "Verify service worker registration and offline page functionality",
      });
    }

    // PWA recommendations
    if (!this.analysisResults.performance.pwaTarget) {
      recommendations.push({
        priority: "MEDIUM",
        category: "PWA",
        message:
          "PWA features incomplete. Ensure manifest, service worker, and offline support.",
        action: "Complete PWA implementation checklist",
      });
    }

    this.analysisResults.recommendations = recommendations;
  }

  displayResults() {
    console.log("📋 Phase 2C Analysis Results");
    console.log("=============================\n");

    // Performance Summary
    const performance = this.analysisResults.performance;
    const totalTargets = Object.keys(performance).length;
    const achievedTargets = Object.values(performance).filter(Boolean).length;
    const successRate = Math.round((achievedTargets / totalTargets) * 100);

    console.log(
      `🎯 Performance Targets: ${achievedTargets}/${totalTargets} (${successRate}%)`
    );
    console.log("=====================================\n");

    // Detailed Results
    Object.entries(performance).forEach(([target, achieved]) => {
      const status = achieved ? "✅" : "❌";
      const targetName = target
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      console.log(
        `${status} ${targetName}: ${achieved ? "Achieved" : "Not Achieved"}`
      );
    });

    console.log("\n📊 Bundle Analysis");
    console.log("==================");

    const bundleSize = this.analysisResults.bundleSize;
    if (bundleSize.stats) {
      console.log(`📦 Total bundle size: ${this.calculateTotalBundleSize()}KB`);
    }

    const chunkSplitting = this.analysisResults.chunkSplitting;
    console.log(`🔀 Total chunks: ${chunkSplitting.totalChunks}`);
    console.log(`📦 Vendor chunks: ${chunkSplitting.vendorChunks}`);
    console.log(`⚠️  Large chunks: ${chunkSplitting.largeChunks}`);

    console.log("\n💾 Caching & PWA");
    console.log("=================");

    const caching = this.analysisResults.caching;
    console.log(`🔧 Service Worker: ${caching.serviceWorker ? "✅" : "❌"}`);
    console.log(`📱 PWA Manifest: ${caching.pwaManifest ? "✅" : "❌"}`);
    console.log(`📴 Offline Support: ${caching.offlineSupport ? "✅" : "❌"}`);

    // Recommendations
    if (this.analysisResults.recommendations.length > 0) {
      console.log("\n💡 Recommendations");
      console.log("==================");

      this.analysisResults.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}`);
        console.log(`   ${rec.message}`);
        console.log(`   Action: ${rec.action}`);
      });
    }

    // Final Status
    console.log("\n🎉 Phase 2C Status");
    console.log("==================");

    if (successRate >= 80) {
      console.log(
        "🚀 EXCELLENT: Phase 2C implementation is highly successful!"
      );
      console.log(
        "📱 OmaHub has achieved premium performance with advanced caching and PWA features."
      );
    } else if (successRate >= 60) {
      console.log("✅ GOOD: Phase 2C implementation is mostly complete.");
      console.log(
        "🔧 Some optimizations are still needed for full performance."
      );
    } else {
      console.log(
        "⚠️  NEEDS WORK: Phase 2C implementation requires significant attention."
      );
      console.log("📋 Review recommendations and implement missing features.");
    }

    console.log(`\n📊 Overall Score: ${successRate}%`);
    console.log(`🎯 Targets Achieved: ${achievedTargets}/${totalTargets}`);
  }
}

// Run the analysis
async function main() {
  const analyzer = new Phase2CAnalyzer();
  const success = await analyzer.analyzeBundle();

  if (success) {
    console.log("\n🎯 Phase 2C Analysis Complete!");
    console.log(
      "📋 Review the results above and implement any recommendations."
    );
  } else {
    console.log("\n❌ Analysis failed. Please check the errors above.");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  });
}

module.exports = Phase2CAnalyzer;
