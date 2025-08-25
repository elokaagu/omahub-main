#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of pages that use useSearchParams and need dynamic rendering
const pagesToFix = [
  'app/page.tsx',
  'app/directory/page.tsx',
  'app/studio/page.tsx',
  'app/about/page.tsx',
  'app/animation-demo/page.tsx',
  'app/auth/success/page.tsx',
  'app/basket/page.tsx',
  'app/collections/page.tsx',
  'app/contact/page.tsx',
  'app/faq/page.tsx',
  'app/favourites/page.tsx',
  'app/favourites/favourites/page.tsx',
  'app/feedback/page.tsx',
  'app/forgot-password/page.tsx',
  'app/how-it-works/page.tsx',
  'app/join/page.tsx',
  'app/login/page.tsx',
  'app/offline/page.tsx',
  'app/password-gate/page.tsx',
  'app/privacy-policy/page.tsx',
  'app/profile/page.tsx',
  'app/reset-password/page.tsx',
  'app/signup/page.tsx',
  'app/studio/brand-display-demo/page.tsx',
  'app/studio/brands/page.tsx',
  'app/studio/brands/create/page.tsx',
  'app/studio/collections/page.tsx',
  'app/studio/collections/create/page.tsx',
  'app/studio/hero/page.tsx',
  'app/studio/hero/create/page.tsx',
  'app/studio/inbox/page.tsx',
  'app/studio/leads/page.tsx',
  'app/studio/portfolio/page.tsx',
  'app/studio/portfolio/create/page.tsx',
  'app/studio/products/page.tsx',
  'app/studio/products/create/page.tsx',
  'app/studio/profile/page.tsx',
  'app/studio/reviews/page.tsx',
  'app/studio/services/page.tsx',
  'app/studio/services/create/page.tsx',
  'app/studio/settings/page.tsx',
  'app/studio/settings/faqs/page.tsx',
  'app/studio/settings/legal-documents/page.tsx',
  'app/studio/spotlight/page.tsx',
  'app/studio/spotlight/create/page.tsx',
  'app/studio/spotlight/debug/page.tsx',
  'app/studio/tags-demo/page.tsx',
  'app/studio/users/page.tsx',
  'app/tailored/page.tsx',
  'app/tailors/page.tsx',
  'app/terms-of-service/page.tsx',
];

function addDynamicExport(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has dynamic export
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`✅ Already fixed: ${filePath}`);
      return true;
    }

    // Check if it's a client component
    if (content.includes('"use client"')) {
      // For client components, add after the "use client" directive
      const newContent = content.replace(
        /("use client";\s*)/,
        '$1\n\n// Force dynamic rendering to avoid useSearchParams issues\nexport const dynamic = \'force-dynamic\';\n'
      );
      
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fixed client component: ${filePath}`);
      return true;
    } else {
      // For server components, add at the top after imports
      const newContent = content.replace(
        /(import.*?;?\s*)/s,
        '$1\n// Force dynamic rendering to avoid useSearchParams issues\nexport const dynamic = \'force-dynamic\';\n\n'
      );
      
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fixed server component: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Fixing useSearchParams pages with dynamic rendering...\n');
  
  let fixedCount = 0;
  let totalCount = pagesToFix.length;
  
  pagesToFix.forEach(pagePath => {
    if (addDynamicExport(pagePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Fixed: ${fixedCount}/${totalCount} pages`);
  console.log(`❌ Failed: ${totalCount - fixedCount} pages`);
  
  if (fixedCount === totalCount) {
    console.log('\n🎉 All pages fixed successfully! The build should now work.');
  } else {
    console.log('\n⚠️  Some pages failed to fix. Check the errors above.');
  }
}

main();
