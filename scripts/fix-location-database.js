const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

async function fixLocationData() {
  console.log('🔧 Starting location data cleanup...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // First, let's see what locations have trailing 'O' or '0' characters
    console.log('🔍 Checking for locations with trailing O or 0...');
    const { data: checkData, error: checkError } = await supabase
      .from('brands')
      .select('id, name, location')
      .or('location.like.%O,location.like.%0');
    
    if (checkError) {
      console.error('❌ Error checking locations:', checkError);
      return;
    }
    
    if (checkData && checkData.length > 0) {
      console.log('📍 Found brands with trailing O or 0:');
      checkData.forEach(brand => {
        console.log(`  - ${brand.name}: "${brand.location}"`);
      });
      
      // Update locations to remove trailing O and 0
      console.log('🧹 Cleaning location data...');
      
      for (const brand of checkData) {
        if (brand.location) {
          // Remove trailing O and 0 characters
          const cleanedLocation = brand.location.replace(/[O0]+$/, '');
          
          if (cleanedLocation !== brand.location) {
            console.log(`  Cleaning "${brand.name}": "${brand.location}" → "${cleanedLocation}"`);
            
            const { error: updateError } = await supabase
              .from('brands')
              .update({ 
                location: cleanedLocation,
                updated_at: new Date().toISOString()
              })
              .eq('id', brand.id);
            
            if (updateError) {
              console.error(`  ❌ Error updating ${brand.name}:`, updateError);
            } else {
              console.log(`  ✅ Updated ${brand.name}`);
            }
          }
        }
      }
    } else {
      console.log('✅ No brands found with trailing O or 0 characters');
    }
    
    // Also check for trailing numbers in general
    console.log('🔍 Checking for locations with trailing numbers...');
    const { data: numberCheckData, error: numberCheckError } = await supabase
      .from('brands')
      .select('id, name, location')
      .not('location', 'is', null);
    
    if (numberCheckError) {
      console.error('❌ Error checking for trailing numbers:', numberCheckError);
      return;
    }
    
    if (numberCheckData) {
      for (const brand of numberCheckData) {
        if (brand.location && /\d+$/.test(brand.location)) {
          // Check if the trailing number makes sense (like "London 2" vs "United Kingdom0")
          const match = brand.location.match(/^([A-Za-z\s,]+)(\d+)$/);
          if (match) {
            const [, textPart, numberPart] = match;
            // If the number is 0 or doesn't make sense as part of the location name
            if (numberPart === '0' || parseInt(numberPart) < 10) {
              const cleanedLocation = textPart.trim();
              console.log(`  Cleaning "${brand.name}": "${brand.location}" → "${cleanedLocation}"`);
              
              const { error: updateError } = await supabase
                .from('brands')
                .update({ 
                  location: cleanedLocation,
                  updated_at: new Date().toISOString()
                })
                .eq('id', brand.id);
              
              if (updateError) {
                console.error(`  ❌ Error updating ${brand.name}:`, updateError);
              } else {
                console.log(`  ✅ Updated ${brand.name}`);
              }
            }
          }
        }
      }
    }
    
    console.log('✅ Location data cleanup completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixLocationData();
