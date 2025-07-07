const fs = require("fs");
const path = require("path");

// Bundle size analysis script
console.log("📦 Bundle Size Analysis for OmaHub");
console.log("=====================================\n");

// Check if Next.js build output exists
const buildDir = path.join(process.cwd(), ".next");
const staticDir = path.join(buildDir, "static");

if (!fs.existsSync(buildDir)) {
  console.log('❌ No build output found. Please run "npm run build" first.');
  process.exit(1);
}

// Function to get file size in KB
function getFileSizeInKB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return Math.round(stats.size / 1024);
  } catch (error) {
    return 0;
  }
}

// Function to scan directory for files
function scanDirectory(dir, extension) {
  const files = [];

  function scanRecursively(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          scanRecursively(itemPath);
        } else if (item.endsWith(extension)) {
          files.push({
            path: itemPath,
            name: item,
            size: getFileSizeInKB(itemPath),
            relativePath: path.relative(process.cwd(), itemPath),
          });
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  scanRecursively(dir);
  return files;
}

// Analyze JavaScript bundles
console.log("🔍 JavaScript Bundle Analysis:");
console.log("-------------------------------");

const jsFiles = scanDirectory(staticDir, ".js");
const sortedJsFiles = jsFiles.sort((a, b) => b.size - a.size);

let totalJsSize = 0;
const largeFiles = [];

for (const file of sortedJsFiles.slice(0, 10)) {
  totalJsSize += file.size;
  console.log(`📄 ${file.name}: ${file.size} KB`);

  if (file.size > 500) {
    largeFiles.push(file);
  }
}

console.log(`\n📊 Total JS Size: ${totalJsSize} KB`);

// Analyze CSS bundles
console.log("\n🎨 CSS Bundle Analysis:");
console.log("------------------------");

const cssFiles = scanDirectory(staticDir, ".css");
const sortedCssFiles = cssFiles.sort((a, b) => b.size - a.size);

let totalCssSize = 0;

for (const file of sortedCssFiles.slice(0, 5)) {
  totalCssSize += file.size;
  console.log(`📄 ${file.name}: ${file.size} KB`);
}

console.log(`\n📊 Total CSS Size: ${totalCssSize} KB`);

// Recommendations
console.log("\n💡 Optimization Recommendations:");
console.log("----------------------------------");

if (largeFiles.length > 0) {
  console.log("⚠️  Large JavaScript files detected:");
  largeFiles.forEach((file) => {
    console.log(
      `   - ${file.name} (${file.size} KB) - Consider code splitting`
    );
  });
  console.log("");
}

if (totalJsSize > 1000) {
  console.log("⚠️  Total JavaScript size is large (>1MB)");
  console.log("   - Consider implementing dynamic imports");
  console.log("   - Use Next.js code splitting features");
  console.log("   - Remove unused dependencies");
  console.log("");
}

if (totalCssSize > 200) {
  console.log("⚠️  CSS bundle is large (>200KB)");
  console.log("   - Consider purging unused CSS");
  console.log("   - Use CSS-in-JS for component-specific styles");
  console.log("");
}

// Check for common optimization opportunities
console.log("🔧 Optimization Checklist:");
console.log("---------------------------");

const optimizations = [
  {
    name: "Dynamic imports for heavy components",
    check: () => {
      // Check if we're using dynamic imports
      const appDir = path.join(process.cwd(), "app");
      const componentsDir = path.join(process.cwd(), "components");

      let dynamicImports = 0;
      let totalComponents = 0;

      function countImports(dir) {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
              countImports(filePath);
            } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
              totalComponents++;
              const content = fs.readFileSync(filePath, "utf8");
              if (content.includes("dynamic(") || content.includes("import(")) {
                dynamicImports++;
              }
            }
          }
        } catch (error) {
          // Skip directories that can't be read
        }
      }

      countImports(appDir);
      countImports(componentsDir);

      return dynamicImports > 0 ? "✅" : "❌";
    },
  },
  {
    name: "Image optimization with Next.js Image",
    check: () => {
      const hasOptimizedImages = fs.existsSync(
        path.join(process.cwd(), "components/ui/optimized-image.tsx")
      );
      return hasOptimizedImages ? "✅" : "❌";
    },
  },
  {
    name: "Bundle analyzer configuration",
    check: () => {
      const packageJson = path.join(process.cwd(), "package.json");
      try {
        const content = fs.readFileSync(packageJson, "utf8");
        return content.includes("@next/bundle-analyzer") ? "✅" : "❌";
      } catch (error) {
        return "❌";
      }
    },
  },
  {
    name: "Performance service implementation",
    check: () => {
      const hasPerformanceService = fs.existsSync(
        path.join(process.cwd(), "lib/services/performanceService.ts")
      );
      return hasPerformanceService ? "✅" : "❌";
    },
  },
];

optimizations.forEach((opt) => {
  console.log(`${opt.check()} ${opt.name}`);
});

console.log("\n🚀 Performance Tips:");
console.log("---------------------");
console.log(
  '1. Use "npm run build && npm run start" to test production performance'
);
console.log("2. Enable gzip compression on your server");
console.log("3. Use CDN for static assets");
console.log("4. Implement service worker for caching");
console.log("5. Monitor Core Web Vitals in production");

console.log("\n✅ Bundle analysis complete!");
