#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

console.log("🔍 Running directory page fix script...");

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File ${filePath} does not exist.`);
      return;
    }

    let content = fs.readFileSync(filePath, "utf8");

    // Replace animation imports with the correct path
    const originalImport = `import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animations";`;

    const fixedImport = `import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animations";`;

    // Even though the import looks the same, this ensures any subtle differences are fixed
    if (content.includes('from "@/components/ui/animations')) {
      content = content.replace(
        /import\s*{[\s\S]*?}\s*from\s*["']@\/components\/ui\/animations.*?["'];/g,
        fixedImport
      );
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed imports in ${filePath}`);
    } else {
      console.log(`⚠️ No animations import found in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing imports in ${filePath}:`, error);
  }
}

// Fix DirectoryClient.tsx
const directoryClientPath = path.join(
  process.cwd(),
  "app",
  "directory",
  "DirectoryClient.tsx"
);
fixImportsInFile(directoryClientPath);

console.log("✅ Directory page fix completed!");
