#!/usr/bin/env node

// Currency Consistency Validation Script
// This script validates that all brands display the correct currency based on their location

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Currency mapping for validation
const CURRENCY_MAPPING = {
  'Nigeria': '₦',
  'Lagos': '₦',
  'Abuja': '₦',
  'Port Harcourt': '₦',
  'Ghana': 'GHS',
  'Accra': 'GHS',
  'Kumasi': 'GHS',
  'Tamale': 'GHS',
  'Kenya': 'KSh',
  'Nairobi': 'KSh',
  'Mombasa': 'KSh',
  'Kisumu': 'KSh',
  'South Africa': 'R',
  'Johannesburg': 'R',
  'Cape Town': 'R',
  'Durban': 'R',
  'Egypt': 'EGP',
  'Cairo': 'EGP',
  'Alexandria': 'EGP',
  'Giza': 'EGP',
  'Morocco': 'MAD',
  'Casablanca': 'MAD',
  'Rabat': 'MAD',
  'Marrakech': 'MAD',
  'Tunisia': 'TND',
  'Tunis': 'TND',
  'Sfax': 'TND',
  'Sousse': 'TND',
  'Senegal': 'XOF',
  'Ivory Coast': 'XOF',
  'Burkina Faso': 'XOF',
  'Mali': 'XOF',
  'Algeria': 'DA',
  'Algiers': 'DA',
  'Oran': 'DA',
  'Constantine': 'DA'
};

async function validateCurrencyConsistency() {
  console.log('🔍 Validating Currency Consistency Across Brands...\n');

  try {
    // Fetch all brands with their location and price_range
    const { data: brands, error } = await supabase
      .from('brands')
      .select('id, name, location, price_range, category')
      .order('location', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch brands: ${error.message}`);
    }

    if (!brands || brands.length === 0) {
      console.log('⚠️ No brands found in the database.');
      return;
    }

    console.log(`📊 Found ${brands.length} brands to validate.\n`);

    const validationResults = {
      correct: [],
      incorrect: [],
      needsReview: [],
      noPriceRange: []
    };

    brands.forEach(brand => {
      const expectedCurrency = getExpectedCurrency(brand.location);
      const actualCurrency = extractCurrencyFromPriceRange(brand.price_range);
      
      if (!brand.price_range || brand.price_range === 'Contact for pricing') {
        validationResults.noPriceRange.push({
          ...brand,
          expectedCurrency,
          actualCurrency: 'None',
          issue: 'No price range set'
        });
      } else if (!expectedCurrency) {
        validationResults.needsReview.push({
          ...brand,
          expectedCurrency: 'Unknown',
          actualCurrency,
          issue: 'Location not recognized'
        });
      } else if (expectedCurrency === actualCurrency) {
        validationResults.correct.push({
          ...brand,
          expectedCurrency,
          actualCurrency,
          status: '✅ Correct'
        });
      } else {
        validationResults.incorrect.push({
          ...brand,
          expectedCurrency,
          actualCurrency,
          issue: `Currency mismatch: Expected ${expectedCurrency}, got ${actualCurrency}`
        });
      }
    });

    // Display results
    displayValidationResults(validationResults);

    // Generate recommendations
    generateRecommendations(validationResults);

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

function getExpectedCurrency(location) {
  if (!location) return null;
  
  const normalizedLocation = location.toLowerCase();
  
  for (const [key, currency] of Object.entries(CURRENCY_MAPPING)) {
    if (normalizedLocation.includes(key.toLowerCase())) {
      return currency;
    }
  }
  
  return null;
}

function extractCurrencyFromPriceRange(priceRange) {
  if (!priceRange || priceRange === 'Contact for pricing') {
    return null;
  }

  // Extract currency symbol from price range (e.g., "₦15,000 - ₦120,000")
  const match = priceRange.match(/^([^\d,]+)/);
  return match ? match[1].trim() : null;
}

function displayValidationResults(results) {
  console.log('📋 Currency Validation Results');
  console.log('==============================\n');

  // Correct currencies
  if (results.correct.length > 0) {
    console.log(`✅ Correct Currencies: ${results.correct.length} brands`);
    console.log('------------------------');
    results.correct.forEach(brand => {
      console.log(`   ${brand.name} (${brand.location}): ${brand.actualCurrency}`);
    });
    console.log('');
  }

  // Incorrect currencies
  if (results.incorrect.length > 0) {
    console.log(`❌ Incorrect Currencies: ${results.incorrect.length} brands`);
    console.log('---------------------------');
    results.incorrect.forEach(brand => {
      console.log(`   ${brand.name} (${brand.location})`);
      console.log(`      Expected: ${brand.expectedCurrency}, Got: ${brand.actualCurrency}`);
      console.log(`      Issue: ${brand.issue}`);
      console.log('');
    });
  }

  // Needs review
  if (results.needsReview.length > 0) {
    console.log(`⚠️ Needs Review: ${results.needsReview.length} brands`);
    console.log('---------------------');
    results.needsReview.forEach(brand => {
      console.log(`   ${brand.name} (${brand.location})`);
      console.log(`      Issue: ${brand.issue}`);
      console.log('');
    });
  }

  // No price range
  if (results.noPriceRange.length > 0) {
    console.log(`📝 No Price Range: ${results.noPriceRange.length} brands`);
    console.log('----------------------');
    results.noPriceRange.forEach(brand => {
      console.log(`   ${brand.name} (${brand.location})`);
      console.log(`      Expected Currency: ${brand.expectedCurrency}`);
      console.log('');
    });
  }

  // Summary
  const total = results.correct.length + results.incorrect.length + results.needsReview.length + results.noPriceRange.length;
  const correctPercentage = ((results.correct.length / total) * 100).toFixed(1);
  
  console.log('📊 Summary');
  console.log('==========');
  console.log(`Total Brands: ${total}`);
  console.log(`✅ Correct: ${results.correct.length} (${correctPercentage}%)`);
  console.log(`❌ Incorrect: ${results.incorrect.length}`);
  console.log(`⚠️ Needs Review: ${results.needsReview.length}`);
  console.log(`📝 No Price Range: ${results.noPriceRange.length}`);
}

function generateRecommendations(results) {
  console.log('\n💡 Recommendations');
  console.log('==================');

  if (results.incorrect.length > 0) {
    console.log('\n🔧 Fix Currency Mismatches:');
    results.incorrect.forEach(brand => {
      console.log(`   - Update ${brand.name} price range to use ${brand.expectedCurrency} instead of ${brand.actualCurrency}`);
    });
  }

  if (results.noPriceRange.length > 0) {
    console.log('\n📝 Add Price Ranges:');
    results.noPriceRange.forEach(brand => {
      console.log(`   - Add price range for ${brand.name} using ${brand.expectedCurrency} currency`);
    });
  }

  if (results.needsReview.length > 0) {
    console.log('\n🔍 Review Locations:');
    results.needsReview.forEach(brand => {
      console.log(`   - Review location for ${brand.name}: "${brand.location}"`);
    });
  }

  if (results.incorrect.length === 0 && results.needsReview.length === 0) {
    console.log('\n🎉 All brands have consistent currencies!');
  }
}

// Run validation
if (require.main === module) {
  validateCurrencyConsistency()
    .then(() => {
      console.log('\n✅ Currency validation complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Currency validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  validateCurrencyConsistency,
  getExpectedCurrency,
  extractCurrencyFromPriceRange
};
