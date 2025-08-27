#!/usr/bin/env node

/**
 * Migrate existing brand images to structured naming convention
 * This script helps organize existing images and demonstrates the new naming system
 */

import { createClient } from '@supabase/supabase-js';
import { 
  generateBrandImageFilename, 
  generateBrandImagePath,
  parseImageFilename,
  getImageDescription 
} from '../lib/services/imageNamingService.js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('');
  console.error('Please set these environment variables and try again.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateToStructuredNaming() {
  try {
    console.log('🚀 Starting migration to structured image naming...');
    
    // 1. Fetch all brands
    console.log('\n📋 Step 1: Fetching all brands...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name, image, created_at')
      .order('name');
    
    if (brandsError) {
      console.error('❌ Error fetching brands:', brandsError);
      return;
    }
    
    console.log(`✅ Found ${brands.length} brands`);
    
    // 2. Analyze existing image naming
    console.log('\n🔍 Step 2: Analyzing existing image naming...');
    const imageAnalysis = [];
    
    for (const brand of brands) {
      if (brand.image) {
        // Extract filename from URL
        const urlParts = brand.image.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        // Parse existing filename
        const metadata = parseImageFilename(filename);
        
        imageAnalysis.push({
          brandId: brand.id,
          brandName: brand.name,
          currentImage: brand.image,
          currentFilename: filename,
          hasStructuredNaming: !!metadata,
          metadata: metadata,
          description: metadata ? getImageDescription(filename) : 'Unknown format'
        });
      }
    }
    
    console.log(`📊 Analyzed ${imageAnalysis.length} brand images`);
    
    // 3. Show current state
    console.log('\n📊 Current Image Naming Status:');
    const structuredCount = imageAnalysis.filter(img => img.hasStructuredNaming).length;
    const legacyCount = imageAnalysis.filter(img => !img.hasStructuredNaming).length;
    
    console.log(`   ✅ Structured naming: ${structuredCount}`);
    console.log(`   ⚠️ Legacy naming: ${legacyCount}`);
    
    // 4. Show examples of what the new naming would look like
    console.log('\n🏷️ Examples of new structured naming:');
    for (const analysis of imageAnalysis.slice(0, 5)) {
      if (!analysis.hasStructuredNaming) {
        // Show what the new name would be
        const mockFile = new File([''], 'example.jpg', { type: 'image/jpeg' });
        const newFilename = generateBrandImageFilename({
          brandId: analysis.brandId,
          brandName: analysis.brandName,
          imageRole: 'cover',
          imageType: 'brand'
        }, mockFile);
        
        const newPath = generateBrandImagePath({
          brandId: analysis.brandId,
          brandName: analysis.brandName,
          imageRole: 'cover',
          imageType: 'brand'
        }, newFilename);
        
        console.log(`\n   Brand: ${analysis.brandName}`);
        console.log(`   Current: ${analysis.currentFilename}`);
        console.log(`   New: ${newFilename}`);
        console.log(`   Path: ${newPath}`);
      }
    }
    
    // 5. Provide migration recommendations
    console.log('\n💡 Migration Recommendations:');
    console.log('   1. Update SimpleFileUpload components to pass brandId and brandName');
    console.log('   2. New uploads will automatically use structured naming');
    console.log('   3. Existing images can be renamed in storage (optional)');
    console.log('   4. Update database references if renaming storage files');
    
    // 6. Show storage organization structure
    console.log('\n📁 New Storage Organization:');
    console.log('   brands/');
    console.log('   ├── ehbs-couture/');
    console.log('   │   ├── logo/');
    console.log('   │   ├── cover/');
    console.log('   │   └── gallery/');
    console.log('   ├── pith-africa/');
    console.log('   │   ├── logo/');
    console.log('   │   ├── cover/');
    console.log('   │   └── gallery/');
    console.log('   └── ...');
    
    // 7. Show benefits
    console.log('\n🎯 Benefits of New Naming Convention:');
    console.log('   ✅ Clear ownership: Each image is tied to its brand');
    console.log('   ✅ Organized storage: Images grouped by brand and type');
    console.log('   ✅ Easy identification: Filename shows brand, role, and timestamp');
    console.log('   ✅ Consistent structure: Same format across all uploads');
    console.log('   ✅ Better management: Easy to find and organize images');
    
    console.log('\n✅ Migration analysis complete!');
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateToStructuredNaming();
