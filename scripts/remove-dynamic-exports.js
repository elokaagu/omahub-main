#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// List of pages that have dynamic exports to remove
const pagesToFix = [
  "app/studio/settings/faqs/page.tsx",
  "app/studio/settings/legal-documents/page.tsx",
  "app/studio/settings/page.tsx",
  "app/studio/spotlight/page.tsx",
  "app/studio/spotlight/create/page.tsx",
  "app/studio/spotlight/debug/page.tsx",
  "app/studio/products/page.tsx",
  "app/studio/products/create/page.tsx",
  "app/studio/inbox/page.tsx",
  "app/studio/brands/page.tsx",
  "app/studio/brands/create/page.tsx",
  "app/studio/leads/page.tsx",
  "app/studio/tags-demo/page.tsx",
  "app/studio/profile/page.tsx",
  "app/studio/users/page.tsx",
  "app/studio/portfolio/page.tsx",
  "app/studio/portfolio/create/page.tsx",
  "app/studio/brand-display-demo/page.tsx",
  "app/studio/hero/page.tsx",
  "app/studio/hero/create/page.tsx",
  "app/studio/collections/page.tsx",
  "app/studio/collections/create/page.tsx",
  "app/studio/page.tsx",
  "app/studio/services/page.tsx",
  "app/studio/services/create/page.tsx",
  "app/studio/reviews/page.tsx",
  "app/basket/page.tsx",
  "app/tailored/page.tsx",
  "app/contact/page.tsx",
  "app/tailors/page.tsx",
  "app/join/page.tsx",
  "app/password-gate/page.tsx",
  "app/auth/success/page.tsx",
  "app/privacy-policy/page.tsx",
  "app/faq/page.tsx",
  "app/signup/page.tsx",
  "app/about/page.tsx",
  "app/favourites/favourites/page.tsx",
  "app/favourites/page.tsx",
  "app/how-it-works/page.tsx",
  "app/directory/page.tsx",
  "app/feedback/page.tsx",
  "app/profile/page.tsx",
  "app/forgot-password/page.tsx",
  "app/layout.tsx",
  "app/terms-of-service/page.tsx",
  "app/reset-password/page.tsx",
  "app/collections/page.tsx",
  "app/page.tsx",
  "app/login/page.tsx",
  "app/offline/page.tsx",
  "app/animation-demo/page.tsx",
];

function removeDynamicExport(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, "utf8");

    // Check if has dynamic export
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`✅ Already clean: ${filePath}`);
      return true;
    }

    // Remove the dynamic export line and the comment above it
    const newContent = content.replace(
      /\/\/ Force dynamic rendering to avoid useSearchParams issues\s*\nexport const dynamic = 'force-dynamic';\s*\n?/g,
      ""
    );

    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Cleaned: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log(
    "🧹 Removing dynamic exports to restore platform functionality...\n"
  );

  let cleanedCount = 0;
  let totalCount = pagesToFix.length;

  pagesToFix.forEach((pagePath) => {
    if (removeDynamicExport(pagePath)) {
      cleanedCount++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`✅ Cleaned: ${cleanedCount}/${totalCount} pages`);
  console.log(`❌ Failed: ${totalCount - cleanedCount} pages`);

  if (cleanedCount === totalCount) {
    console.log(
      "\n🎉 All pages cleaned successfully! The platform should now work normally."
    );
  } else {
    console.log("\n⚠️  Some pages failed to clean. Check the errors above.");
  }
}

main();
