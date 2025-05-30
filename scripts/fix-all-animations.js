#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔧 Running comprehensive animation fix script...");

// 1. First, clear the Next.js cache
console.log("🧹 Clearing Next.js cache...");
try {
  execSync("node scripts/clear-cache.js", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Error clearing cache:", error);
}

// 2. Ensure animation files exist and are correctly formatted
console.log("📋 Setting up animation files...");

// Copy animation files to the correct locations
const animationSrcPath = path.join(
  process.cwd(),
  "components",
  "ui",
  "animations.tsx"
);
const jsAnimationSrcPath = path.join(
  process.cwd(),
  "components",
  "ui",
  "animations.js"
);
const indexSrcPath = path.join(process.cwd(), "components", "ui", "index.js");

const animationAppDestPath = path.join(
  process.cwd(),
  "app",
  "components",
  "ui",
  "animations.tsx"
);
const jsAnimationAppDestPath = path.join(
  process.cwd(),
  "app",
  "components",
  "ui",
  "animations.js"
);
const indexAppDestPath = path.join(
  process.cwd(),
  "app",
  "components",
  "ui",
  "index.js"
);

// Ensure app/components/ui directory exists
const appComponentsUiDir = path.join(process.cwd(), "app", "components", "ui");
if (!fs.existsSync(appComponentsUiDir)) {
  fs.mkdirSync(appComponentsUiDir, { recursive: true });
  console.log(`✅ Created directory ${appComponentsUiDir}`);
}

// Copy the files
function copyFile(src, dest) {
  try {
    if (fs.existsSync(src)) {
      // Read the file content
      let content = fs.readFileSync(src, "utf8");

      // If it's the animations.tsx file, ensure all imports use absolute paths
      if (src.endsWith("animations.tsx")) {
        content = content.replace(
          /from ["']\.\.\/(.+)["']/g,
          'from "@/components/ui/$1"'
        );

        // Also remove file extensions from imports to prevent issues
        content = content.replace(/from ["'](.+)\.tsx["']/g, 'from "$1"');
        content = content.replace(/from ["'](.+)\.jsx["']/g, 'from "$1"');
      }

      // Write the fixed content
      fs.writeFileSync(dest, content);
      console.log(
        `✅ Copied and fixed ${path.basename(src)} to app/components/ui/`
      );
    } else {
      console.log(`⚠️ Source file ${src} does not exist`);
    }
  } catch (error) {
    console.error(`❌ Error copying ${src} to ${dest}:`, error);
  }
}

copyFile(animationSrcPath, animationAppDestPath);
copyFile(jsAnimationSrcPath, jsAnimationAppDestPath);
copyFile(indexSrcPath, indexAppDestPath);

// 3. Fix animation imports in key pages
console.log("🔧 Fixing animation imports in pages...");

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File ${filePath} does not exist.`);
      return;
    }

    let content = fs.readFileSync(filePath, "utf8");

    // Replace animation imports with the correct path
    // Note: We're removing the file extension in the import path
    const fixedImport = `import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animations";`;

    // This regex will match import statements for animations components
    const hasAnimationImport =
      content.includes('from "@/components/ui/animations') ||
      content.includes('from "../components/ui/animations') ||
      content.includes('from "../../components/ui/animations');

    if (hasAnimationImport) {
      // Fix all variations of animation imports
      content = content.replace(
        /import\s*{[\s\S]*?}\s*from\s*["'](?:@\/|\.\.\/|\.\.\/\.\.\/)?components\/ui\/animations(?:\.tsx)?["'];/g,
        fixedImport
      );
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed imports in ${filePath}`);
    } else {
      console.log(`ℹ️ No animations import found in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing imports in ${filePath}:`, error);
  }
}

// List of files to fix
const filesToFix = [
  path.join(process.cwd(), "app", "page.tsx"),
  path.join(process.cwd(), "app", "directory", "DirectoryClient.tsx"),
  path.join(process.cwd(), "app", "directory", "page.tsx"),
  path.join(process.cwd(), "app", "how-it-works", "page.tsx"),
  path.join(process.cwd(), "app", "how-it-works", "HowItWorksClient.tsx"),
  path.join(process.cwd(), "app", "about", "page.tsx"),
  path.join(process.cwd(), "app", "brand", "[id]", "page.tsx"),
  path.join(process.cwd(), "app", "HomeContent.tsx"),
];

filesToFix.forEach((file) => fixImportsInFile(file));

console.log(
  '✅ Animation fixes completed! You can now run "npm run dev" to start the development server.'
);
