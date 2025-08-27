# 🏷️ OmaHub Image Naming Convention

## 🎯 Overview

This document outlines the structured naming convention for all images uploaded to OmaHub. The new system ensures clear identification of image ownership, purpose, and organization.

## 📁 Naming Format

### Brand Images
**Format**: `{brandId}_{brandSlug}_{role}_{timestamp}.{extension}`

**Example**: `ehbs-couture_ehbs-couture_logo_1703123456789.jpg`

**Components**:
- `brandId`: Unique brand identifier (e.g., `ehbs-couture`)
- `brandSlug`: URL-friendly brand name (e.g., `ehbs-couture`)
- `role`: Image purpose (e.g., `logo`, `cover`, `gallery`)
- `timestamp`: Unix timestamp for uniqueness
- `extension`: File extension (e.g., `.jpg`, `.png`)

### Product Images
**Format**: `{brandId}_prod_{productId}_{role}_{timestamp}.{extension}`

**Example**: `ehbs-couture_prod_123_main_1703123456789.jpg`

### Collection Images
**Format**: `{brandId}_coll_{collectionId}_{role}_{timestamp}.{extension}`

**Example**: `ehbs-couture_coll_456_cover_1703123456789.jpg`

### User Images
**Format**: `{userId}_{role}_{timestamp}.{extension}`

**Example**: `user123_avatar_1703123456789.jpg`

## 🗂️ Storage Organization

```
brand-assets/
├── brands/
│   ├── ehbs-couture/
│   │   ├── logo/
│   │   │   └── ehbs-couture_ehbs-couture_logo_1703123456789.jpg
│   │   ├── cover/
│   │   │   └── ehbs-couture_ehbs-couture_cover_1703123456790.jpg
│   │   └── gallery/
│   │       └── ehbs-couture_ehbs-couture_gallery_1703123456791.jpg
│   ├── pith-africa/
│   │   ├── logo/
│   │   └── cover/
│   └── ...
├── products/
│   ├── ehbs-couture/
│   │   ├── prod_123/
│   │   │   ├── main_1703123456792.jpg
│   │   │   └── gallery_1703123456793.jpg
│   │   └── prod_124/
│   └── ...
└── collections/
    ├── ehbs-couture/
    │   ├── coll_456/
    │   │   └── cover_1703123456794.jpg
    │   └── coll_457/
    └── ...
```

## 🔧 Implementation

### 1. Update Upload Components

Pass brand information to `SimpleFileUpload`:

```tsx
<SimpleFileUpload
  onUploadComplete={handleImageUpload}
  bucket="brand-assets"
  accept="image/png,image/jpeg,image/webp"
  maxSize={5}
  brandId="ehbs-couture"
  brandName="Ehbs Couture"
  imageRole="cover"
  imageType="brand"
/>
```

### 2. Automatic Naming

When brand information is provided, the component automatically:
- Generates structured filenames
- Creates organized storage paths
- Maintains consistency across uploads

### 3. Fallback Support

For existing uploads without brand information:
- Uses legacy naming convention
- Maintains backward compatibility
- No breaking changes to existing functionality

## 📊 Benefits

### ✅ **Clear Ownership**
- Every image is tied to its brand
- No confusion about which images belong where
- Easy to identify orphaned images

### ✅ **Organized Storage**
- Logical folder structure by brand and type
- Easy to navigate and manage
- Scalable for large numbers of brands

### ✅ **Easy Identification**
- Filename shows brand, role, and timestamp
- Human-readable and searchable
- Consistent format across all uploads

### ✅ **Better Management**
- Easy to find specific images
- Simple to organize by brand or type
- Clear audit trail of uploads

### ✅ **Future-Proof**
- Extensible for new image types
- Consistent with industry standards
- Easy to implement additional features

## 🚀 Migration

### Phase 1: New Uploads (Immediate)
- Update upload components to pass brand information
- New images automatically use structured naming
- No changes to existing images

### Phase 2: Existing Images (Optional)
- Run migration script to analyze current state
- Optionally rename existing images in storage
- Update database references if needed

### Phase 3: Full Implementation
- All new uploads use structured naming
- Existing images gradually migrated
- Complete organization achieved

## 🔍 Usage Examples

### Brand Logo Upload
```tsx
<SimpleFileUpload
  brandId="ehbs-couture"
  brandName="Ehbs Couture"
  imageRole="logo"
  imageType="brand"
  onUploadComplete={handleLogoUpload}
/>
```

**Result**: `ehbs-couture_ehbs-couture_logo_1703123456789.jpg`
**Path**: `brands/ehbs-couture/logo/ehbs-couture_ehbs-couture_logo_1703123456789.jpg`

### Product Image Upload
```tsx
<SimpleFileUpload
  brandId="ehbs-couture"
  brandName="Ehbs Couture"
  imageRole="main"
  imageType="product"
  onUploadComplete={handleProductImageUpload}
/>
```

**Result**: `ehbs-couture_prod_123_main_1703123456790.jpg`
**Path**: `products/ehbs-couture/prod_123/ehbs-couture_prod_123_main_1703123456790.jpg`

## 🛠️ Utilities

### Parse Filename
```typescript
import { parseImageFilename } from '@/lib/services/imageNamingService';

const metadata = parseImageFilename('ehbs-couture_ehbs-couture_logo_1703123456789.jpg');
// Returns: { brandId: 'ehbs-couture', brandSlug: 'ehbs-couture', role: 'logo', timestamp: 1703123456789, imageType: 'brand' }
```

### Get Description
```typescript
import { getImageDescription } from '@/lib/services/imageNamingService';

const description = getImageDescription('ehbs-couture_ehbs-couture_logo_1703123456789.jpg');
// Returns: "Logo for brand ehbs-couture"
```

### Validate Filename
```typescript
import { validateImageFilename } from '@/lib/services/imageNamingService';

const isValid = validateImageFilename('ehbs-couture_ehbs-couture_logo_1703123456789.jpg');
// Returns: true
```

## 📝 Notes

- **Backward Compatible**: Existing images continue to work
- **Gradual Migration**: No need to update everything at once
- **Optional**: Structured naming is opt-in, not required
- **Extensible**: Easy to add new image types and roles
- **Consistent**: Same format across all upload components

## 🎯 Next Steps

1. **Update Upload Components**: Pass brand information where available
2. **Test New Naming**: Verify structured naming works correctly
3. **Monitor Uploads**: Ensure new images use the convention
4. **Optional Migration**: Consider migrating existing images
5. **Documentation**: Update team on new naming system

---

*This naming convention ensures OmaHub images are organized, identifiable, and manageable for years to come.* 🚀
