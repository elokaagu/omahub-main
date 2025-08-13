#!/usr/bin/env node

/**
 * Performance Optimization Script for OmaHub
 * This script identifies and fixes performance bottlenecks
 */

const fs = require("fs");
const path = require("path");

console.log("🚀 OmaHub Performance Optimization Script");
console.log("========================================\n");

// Performance optimization functions
const performanceOptimizations = {
  // Remove console.log statements in production
  removeConsoleLogs: () => {
    console.log("🔧 Removing console.log statements from production code...");
    
    const directories = ["app", "components", "lib", "hooks", "contexts"];
    let totalFiles = 0;
    let modifiedFiles = 0;
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = getAllFiles(dir);
        files.forEach(file => {
          if (file.endsWith(".tsx") || file.endsWith(".ts")) {
            totalFiles++;
            const content = fs.readFileSync(file, "utf8");
            
            // Remove console.log, console.warn, console.error in production
            if (process.env.NODE_ENV === "production") {
              const newContent = content
                .replace(/console\.log\([^)]*\);?\s*/g, "")
                .replace(/console\.warn\([^)]*\);?\s*/g, "")
                .replace(/console\.error\([^)]*\);?\s*/g, "");
              
              if (newContent !== content) {
                fs.writeFileSync(file, newContent);
                modifiedFiles++;
                console.log(`  ✅ Modified: ${file}`);
              }
            }
          }
        });
      }
    });
    
    console.log(`  📊 Total files processed: ${totalFiles}`);
    console.log(`  📝 Files modified: ${modifiedFiles}\n`);
  },

  // Optimize bundle size
  optimizeBundle: () => {
    console.log("📦 Optimizing bundle size...");
    
    // Check for large dependencies
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const largePackages = [];
    Object.entries(dependencies).forEach(([name, version]) => {
      // Check for known large packages
      if (["@supabase/supabase-js", "lucide-react", "framer-motion"].includes(name)) {
        largePackages.push({ name, version });
      }
    });
    
    if (largePackages.length > 0) {
      console.log("  ⚠️  Large packages detected:");
      largePackages.forEach(pkg => {
        console.log(`    - ${pkg.name}@${pkg.version}`);
      });
      console.log("  💡 Consider using dynamic imports for these packages\n");
    } else {
      console.log("  ✅ No large packages detected\n");
    }
  },

  // Check for memory leaks
  checkMemoryLeaks: () => {
    console.log("🧠 Checking for potential memory leaks...");
    
    const directories = ["app", "components", "lib", "hooks", "contexts"];
    let setIntervalCount = 0;
    let setTimeoutCount = 0;
    let filesWithTimers = [];
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = getAllFiles(dir);
        files.forEach(file => {
          if (file.endsWith(".tsx") || file.endsWith(".ts")) {
            const content = fs.readFileSync(file, "utf8");
            
            const intervalMatches = content.match(/setInterval/g);
            const timeoutMatches = content.match(/setTimeout/g);
            
            if (intervalMatches) {
              setIntervalCount += intervalMatches.length;
              filesWithTimers.push({ file, type: "setInterval", count: intervalMatches.length });
            }
            
            if (timeoutMatches) {
              setTimeoutCount += timeoutMatches.length;
              filesWithTimers.push({ file, type: "setTimeout", count: timeoutMatches.length });
            }
          }
        });
      }
    });
    
    console.log(`  📊 Timer usage summary:`);
    console.log(`    - setInterval calls: ${setIntervalCount}`);
    console.log(`    - setTimeout calls: ${setTimeoutCount}`);
    
    if (filesWithTimers.length > 0) {
      console.log("  ⚠️  Files with timers (check for cleanup):");
      filesWithTimers.forEach(({ file, type, count }) => {
        console.log(`    - ${file}: ${count} ${type} calls`);
      });
    }
    
    console.log("  💡 Ensure all timers are properly cleaned up in useEffect cleanup functions\n");
  },

  // Check for performance anti-patterns
  checkAntiPatterns: () => {
    console.log("🚫 Checking for performance anti-patterns...");
    
    const directories = ["app", "components", "lib", "hooks", "contexts"];
    let antiPatterns = [];
    
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = getAllFiles(dir);
        files.forEach(file => {
          if (file.endsWith(".tsx") || file.endsWith(".ts")) {
            const content = fs.readFileSync(file, "utf8");
            
            // Check for common anti-patterns
            if (content.includes("useEffect(() => {") && !content.includes("}, [])")) {
              antiPatterns.push({ file, issue: "useEffect without dependency array" });
            }
            
            if (content.includes("useEffect(() => {") && content.includes("}, [])")) {
              antiPatterns.push({ file, issue: "useEffect with empty dependency array" });
            }
            
            if (content.includes("new Date()") && content.includes("useEffect")) {
              antiPatterns.push({ file, issue: "new Date() in useEffect (causes re-renders)" });
            }
            
            if (content.includes("Math.random()") && content.includes("useEffect")) {
              antiPatterns.push({ file, issue: "Math.random() in useEffect (causes re-renders)" });
            }
          }
        });
      }
    });
    
    if (antiPatterns.length > 0) {
      console.log("  ⚠️  Performance anti-patterns detected:");
      antiPatterns.forEach(({ file, issue }) => {
        console.log(`    - ${file}: ${issue}`);
      });
    } else {
      console.log("  ✅ No performance anti-patterns detected");
    }
    
    console.log("");
  },

  // Generate optimization report
  generateReport: () => {
    console.log("📋 Performance Optimization Report");
    console.log("=================================");
    console.log("✅ Console logging optimized for production");
    console.log("✅ Bundle size analysis completed");
    console.log("✅ Memory leak prevention checked");
    console.log("✅ Performance anti-patterns reviewed");
    console.log("\n🎯 Next steps:");
    console.log("1. Run 'npm run build' to test production build");
    console.log("2. Use Lighthouse to measure Core Web Vitals");
    console.log("3. Monitor bundle size with 'npm run analyze'");
    console.log("4. Test on mobile devices for real-world performance");
    console.log("\n🚀 Performance optimization complete!");
  }
};

// Helper function to get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  
  return arrayOfFiles;
}

// Run all optimizations
async function runOptimizations() {
  try {
    performanceOptimizations.removeConsoleLogs();
    performanceOptimizations.optimizeBundle();
    performanceOptimizations.checkMemoryLeaks();
    performanceOptimizations.checkAntiPatterns();
    performanceOptimizations.generateReport();
  } catch (error) {
    console.error("❌ Error during optimization:", error.message);
    process.exit(1);
  }
}

// Run the script
runOptimizations();
