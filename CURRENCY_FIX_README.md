# 🔧 Currency Consistency Fix Guide

## 🚨 **Issue Identified**

OmaHub has currency inconsistency issues where brands are displaying incorrect currencies:

- **Ghanaian brands** showing Nigerian Naira (₦) instead of Ghanaian Cedi (GHS)
- **Nigerian brands** showing Ghanaian Cedi (GHS) instead of Nigerian Naira (₦)
- **Mixed currencies** across different display locations

## 📱 **Examples from Screenshots**

1. **"Rena" brand**: Shows "GHS1,000" (correct for Ghana)
2. **"Ivy Pant Set"**: Shows "₦1,500" (correct for Nigeria)
3. **Inconsistent display**: Same brand showing different currencies in different locations

## 🔍 **Root Causes**

1. **Multiple currency definitions** scattered across different files
2. **Inconsistent currency extraction logic** 
3. **Missing centralized currency management**
4. **Hardcoded currency fallbacks**
5. **Location-currency mapping not enforced**

## ✅ **Solutions Implemented**

### 1. **Centralized Currency System** (`lib/utils/currencyUtils.ts`)

- **Single source of truth** for all currency definitions
- **Location-based currency detection** (e.g., Ghana → GHS, Nigeria → ₦)
- **Brand currency validation** and consistency checking
- **Automatic currency fallbacks** based on brand location

### 2. **Enhanced Price Formatting** (`lib/utils/priceFormatter.ts`)

- **Brand-aware price formatting** using centralized currency system
- **Automatic currency detection** from brand location and price range
- **Consistent display** across all product locations
- **Deprecated old methods** in favor of new centralized approach

### 3. **Currency Fix Scripts**

- **SQL script** (`scripts/fix-currency-inconsistencies.sql`) to update existing brands
- **Validation script** (`scripts/validate-currency-consistency.js`) to check consistency
- **Automated fixes** for common currency mismatches

## 🚀 **How to Fix Currency Issues**

### **Step 1: Run the Currency Fix Script**

```bash
# Execute the SQL script in your Supabase SQL editor
# Copy and paste the contents of scripts/fix-currency-inconsistencies.sql
```

### **Step 2: Validate the Fixes**

```bash
# Run the validation script
node scripts/validate-currency-consistency.js
```

### **Step 3: Update Your Code**

Replace old currency methods with new centralized ones:

```typescript
// ❌ OLD WAY (deprecated)
import { extractCurrencyFromPriceRange } from '@/lib/utils/priceFormatter';
const currency = extractCurrencyFromPriceRange(brand.price_range);

// ✅ NEW WAY (preferred)
import { getBrandCurrency } from '@/lib/utils/currencyUtils';
const currency = getBrandCurrency(brand);
```

### **Step 4: Update Components**

Update your components to use the new currency system:

```typescript
// Before
const price = formatPrice(product.price, '$');

// After
import { formatPriceWithBrand } from '@/lib/utils/priceFormatter';
const price = formatPriceWithBrand(product.price, product.brand);
```

## 📊 **Currency Mapping**

| Country/Location | Currency Code | Symbol | Example |
|------------------|----------------|---------|---------|
| Nigeria | NGN | ₦ | ₦15,000 - ₦120,000 |
| Ghana | GHS | GHS | GHS1,000 - GHS5,000 |
| Kenya | KES | KSh | KSh2,000 - KSh10,000 |
| South Africa | ZAR | R | R500 - R2,500 |
| Egypt | EGP | EGP | EGP200 - EGP1,000 |
| Morocco | MAD | MAD | MAD300 - MAD1,500 |
| Tunisia | TND | TND | TND150 - TND800 |
| Senegal | XOF | XOF | XOF25,000 - XOF150,000 |
| Algeria | DZD | DA | DA15,000 - DA80,000 |

## 🔧 **Manual Fixes for Specific Brands**

### **Ghanaian Brands**
```sql
UPDATE brands 
SET price_range = REPLACE(price_range, '₦', 'GHS')
WHERE location ILIKE '%Ghana%' OR location ILIKE '%Accra%';
```

### **Nigerian Brands**
```sql
UPDATE brands 
SET price_range = REPLACE(price_range, 'GHS', '₦')
WHERE location ILIKE '%Nigeria%' OR location ILIKE '%Lagos%';
```

### **Other Countries**
```sql
-- Kenya
UPDATE brands SET price_range = REPLACE(price_range, '₦', 'KSh') WHERE location ILIKE '%Kenya%';

-- South Africa  
UPDATE brands SET price_range = REPLACE(price_range, '₦', 'R') WHERE location ILIKE '%South Africa%';
```

## 📱 **Testing the Fixes**

### **1. Check Brand Profiles**
- Navigate to `/studio/brands/[id]`
- Verify currency matches location
- Update price range if needed

### **2. Check Product Display**
- View products on homepage
- Verify currency consistency
- Check "You May Also Like" sections

### **3. Validate Across Locations**
- Homepage collections
- Brand profile pages
- Product detail pages
- Search results

## 🎯 **Expected Results**

After implementing the fixes:

- ✅ **Ghanaian brands** will consistently show GHS
- ✅ **Nigerian brands** will consistently show ₦
- ✅ **All currencies** will match brand locations
- ✅ **No more mixed currencies** in product displays
- ✅ **Consistent user experience** across all pages

## 🔍 **Monitoring & Prevention**

### **Regular Validation**
```bash
# Run monthly currency validation
node scripts/validate-currency-consistency.js
```

### **Code Reviews**
- Check for hardcoded currency symbols
- Ensure new brands use centralized currency system
- Validate location-currency consistency

### **Automated Checks**
- Add currency validation to CI/CD pipeline
- Implement currency consistency tests
- Monitor for currency mismatches

## 📚 **Additional Resources**

- [Currency Utils Documentation](./lib/utils/currencyUtils.ts)
- [Price Formatter Documentation](./lib/utils/priceFormatter.ts)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Brand Management Guide](./docs/BRAND_OWNER_SETUP.md)

## 🆘 **Need Help?**

If you encounter issues:

1. **Check the validation script** for specific problems
2. **Review brand locations** in the database
3. **Verify price range formats** match expected patterns
4. **Contact the development team** for complex cases

---

**Status**: ✅ **FIXES IMPLEMENTED**  
**Next Steps**: Run the fix scripts and validate results  
**Timeline**: 1-2 hours to complete all fixes
