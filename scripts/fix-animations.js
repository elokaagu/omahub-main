const fs = require("fs");
const path = require("path");

console.log("🔍 Running animations fix script...");

// Define paths
const sourceAnimationsPath = path.join(
  process.cwd(),
  "components",
  "ui",
  "animations.tsx"
);
const sourceJSPath = path.join(
  process.cwd(),
  "components",
  "ui",
  "animations.js"
);
const appComponentsDir = path.join(process.cwd(), "app", "components");
const appUiDir = path.join(appComponentsDir, "ui");
const appAnimationsPath = path.join(appUiDir, "animations.tsx");
const appAnimationsJSPath = path.join(appUiDir, "animations.js");
const indexPath = path.join(process.cwd(), "components", "ui", "index.js");
const appIndexPath = path.join(appUiDir, "index.js");

// Check for animations.tsx
let sourceExists = fs.existsSync(sourceAnimationsPath);
let jsSourceExists = fs.existsSync(sourceJSPath);

if (!sourceExists && !jsSourceExists) {
  console.error(
    "❌ Error: Neither animations.tsx nor animations.js exists in components/ui directory"
  );
  process.exit(1);
}

// Create app/components/ui directory if it doesn't exist
if (!fs.existsSync(appComponentsDir)) {
  console.log("📁 Creating app/components directory...");
  fs.mkdirSync(appComponentsDir, { recursive: true });
}

if (!fs.existsSync(appUiDir)) {
  console.log("📁 Creating app/components/ui directory...");
  fs.mkdirSync(appUiDir, { recursive: true });
}

// Copy animations files to app/components/ui/
if (sourceExists) {
  console.log("📋 Copying animations.tsx to app/components/ui/...");
  fs.copyFileSync(sourceAnimationsPath, appAnimationsPath);
  console.log("✅ animations.tsx copied successfully");
}

if (jsSourceExists) {
  console.log("📋 Copying animations.js to app/components/ui/...");
  fs.copyFileSync(sourceJSPath, appAnimationsJSPath);
  console.log("✅ animations.js copied successfully");
}

// Create or copy index.js
if (fs.existsSync(indexPath)) {
  console.log("📋 Copying index.js to app/components/ui/...");
  fs.copyFileSync(indexPath, appIndexPath);
  console.log("✅ index.js copied successfully");
} else {
  console.log("📝 Creating index.js in app/components/ui/...");

  const indexContent = `// Re-export animations from the source
export {
  PageFade,
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem
} from '../../../components/ui/animations';`;

  fs.writeFileSync(appIndexPath, indexContent);
  console.log("✅ index.js created successfully");
}

// Update imports in app/page.tsx
const pageFilePath = path.join(process.cwd(), "app", "page.tsx");
if (fs.existsSync(pageFilePath)) {
  console.log("🔧 Fixing imports in app/page.tsx...");
  let pageContent = fs.readFileSync(pageFilePath, "utf8");

  // Fix the problematic import with .tsx extension
  pageContent = pageContent.replace(
    /from\s+["']\.\.\/components\/ui\/animations\.tsx["']/g,
    `from "@/components/ui/animations"`
  );

  fs.writeFileSync(pageFilePath, pageContent);
  console.log("✅ Fixed imports in app/page.tsx");
}

console.log("✅ Animation files fix completed!");
