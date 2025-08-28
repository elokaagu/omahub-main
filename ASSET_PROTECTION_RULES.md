# 🛡️ OmaHub Asset & Rendering Protection Rules

## 🎯 Purpose
This document establishes strict rules to prevent the loss of brand images and videos, and to ensure that rendering functionality remains stable across all updates.

## 📋 Core Rules

### Rule 1: Database Asset Management
**❌ FORBIDDEN:**
- Direct database updates to `brand_images`, `video_url`, `image` fields via CLI
- Scripts that modify storage paths or asset URLs
- Database migrations that change existing asset data
- Manual SQL updates to asset-related tables

**✅ ONLY ALLOWED:**
- Studio interface uploads and management
- User-initiated changes through the web interface
- Bug fixes that don't alter asset data

### Rule 2: Video Rendering Protection
**❌ FORBIDDEN:**
- Modifying `VideoPlayer` component without thorough testing
- Changing video URL construction logic
- Altering video fallback mechanisms
- Removing video event handlers

**✅ ONLY ALLOWED:**
- Bug fixes that preserve existing video functionality
- Performance improvements that don't affect rendering
- UI enhancements that maintain video display

### Rule 3: Image Rendering Protection
**❌ FORBIDDEN:**
- Changing `brand_images` table structure
- Modifying image URL construction in components
- Altering image fallback mechanisms
- Changing `brand_images(*)` select statements

**✅ ONLY ALLOWED:**
- UI improvements that don't affect image display
- Performance optimizations that preserve data structure
- Bug fixes that maintain image functionality

### Rule 4: Data Flow Protection
**❌ FORBIDDEN:**
- Changing how `getAllBrands` fetches `brand_images`
- Modifying the `brand_images(*)` select statements
- Altering image URL construction in service files
- Changing the relationship between `brands` and `brand_images`

**✅ ONLY ALLOWED:**
- Performance optimizations that preserve data structure
- Bug fixes that maintain existing data flow
- UI enhancements that don't affect data fetching

## 🔒 Protected Components

### Video System
- `components/ui/video-player.tsx` - Core video rendering
- `components/ui/brand-card.tsx` - Video display logic
- `app/HomeContent.tsx` - Video data passing
- `lib/services/brandService.ts` - Video data fetching

### Image System
- `components/ui/brand-card.tsx` - Image display logic
- `app/HomeContent.tsx` - Image data passing
- `lib/services/brandService.ts` - Image data fetching
- `app/api/favourites/route.ts` - Image data in favourites

## 🚨 Emergency Procedures

### If Videos Stop Working
1. **DO NOT** modify VideoPlayer component
2. **DO NOT** change video URL construction
3. **CHECK** console for video event logs
4. **VERIFY** video URLs are being passed correctly
5. **TEST** with existing working videos first

### If Images Stop Working
1. **DO NOT** modify brand_images table structure
2. **DO NOT** change image URL construction
3. **CHECK** console for image loading errors
4. **VERIFY** brand_images(*) is being selected
5. **TEST** with existing working images first

## 📝 Change Approval Process

### Before Making Changes
1. **READ** this document completely
2. **IDENTIFY** which rules apply to your change
3. **TEST** changes on development environment
4. **VERIFY** videos and images still work
5. **DOCUMENT** what was changed and why

### Required Testing
- [ ] Videos render correctly on homepage
- [ ] Images display correctly on homepage
- [ ] Videos work in brand cards
- [ ] Images work in brand cards
- [ ] Favourites page shows images correctly
- [ ] No console errors related to assets

## 🎯 Success Metrics

### Video System
- ✅ All brands with videos display videos correctly
- ✅ No red error icons on video cards
- ✅ Videos autoplay and loop as expected
- ✅ Video fallbacks work when needed

### Image System
- ✅ All brands display images correctly
- ✅ No blank/placeholder cards
- ✅ Images load from brand_images table
- ✅ Fallback images work when needed

## 📞 Emergency Contacts

If assets are lost or rendering breaks:
1. **STOP** all changes immediately
2. **REVERT** to last working commit
3. **DOCUMENT** what caused the issue
4. **UPDATE** this document with new rules if needed

---

**Last Updated:** January 2025
**Version:** 1.0
**Status:** ACTIVE - ALL RULES MUST BE FOLLOWED
