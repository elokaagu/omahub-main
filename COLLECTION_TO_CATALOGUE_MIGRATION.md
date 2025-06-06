# Collection to Catalogue Migration Plan

## Overview

This document tracks the comprehensive migration from "collection" terminology to "catalogue" across the entire OmaHub platform.

## Database Changes Required

### 1. Table Rename

- `collections` → `catalogues`
- `collection_images` → `catalogue_images`

### 2. Column Renames

- `collection_id` → `catalogue_id` (in products table)
- Any other collection references in database

### 3. RLS Policies Update

- Update all policies referencing collections table

## File System Changes

### 1. Directory Renames

- `app/collection/` → `app/catalogue/`
- `app/collections/` → `app/catalogues/`
- `app/studio/collections/` → `app/studio/catalogues/`
- `app/api/studio/collections/` → `app/api/studio/catalogues/`

### 2. File Renames

- `lib/services/collectionService.ts` → `lib/services/catalogueService.ts`
- `lib/services/collectionImageService.ts` → `lib/services/catalogueImageService.ts`
- All script files with "collection" in name

## Code Changes

### 1. Type Definitions

- `Collection` interface → `Catalogue`
- All related type references

### 2. API Routes

- `/api/studio/collections` → `/api/studio/catalogues`
- All collection-related endpoints

### 3. Frontend Routes

- `/collection/[id]` → `/catalogue/[id]`
- `/collections` → `/catalogues`
- `/studio/collections` → `/studio/catalogues`

### 4. Service Functions

- All function names with "collection" → "catalogue"
- All variable names and references

### 5. UI Text Updates

- All user-facing text: "Collection" → "Catalogue"
- Navigation labels
- Page titles
- Form labels
- Error messages

## Migration Steps

1. ✅ Create migration plan
2. ⏳ Update database schema
3. ⏳ Rename directories and files
4. ⏳ Update type definitions
5. ⏳ Update service layer
6. ⏳ Update API routes
7. ⏳ Update frontend components
8. ⏳ Update UI text
9. ⏳ Update documentation
10. ⏳ Test all functionality

## Rollback Plan

- Keep backup of original files
- Document all changes for potential rollback
- Test thoroughly before final deployment

## Notes

- This is a breaking change that affects URLs
- Consider implementing redirects for SEO
- Update any external documentation
- Notify stakeholders of URL changes
