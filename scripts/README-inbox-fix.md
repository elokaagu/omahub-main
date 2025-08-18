# Inbox Deletion Issue - Root Cause & Fix

## 🚨 **Problem Identified**

The Studio Inbox deletion was failing because **Row Level Security (RLS) policies were missing DELETE permissions** for the `inquiries` table and related tables.

## 🔍 **What Was Happening**

1. ✅ Frontend sends DELETE request
2. ✅ Backend processes deletion  
3. ❌ **Supabase RLS silently blocks DELETE operation** (no policy exists)
4. ❌ Backend thinks deletion succeeded (no error thrown)
5. ❌ Verification shows inquiry still exists in database
6. ✅ API returns 500 error (our verification fix working correctly)

## 🔧 **The Fix**

### **Option 1: Quick Fix (Recommended)**
Run the comprehensive policy fix:
```sql
-- Execute this in Supabase SQL Editor
\i scripts/fix-all-inbox-policies.sql
```

### **Option 2: Manual Fix**
Add only the missing DELETE policies:
```sql
-- Execute this in Supabase SQL Editor  
\i scripts/fix-inquiries-delete-policy.sql
```

## 📋 **What the Fix Does**

The scripts add missing DELETE policies for:
- `inquiries` table
- `inquiry_replies` table  
- `inquiry_attachments` table

For both:
- **Brand Admins**: Can delete inquiries for their brands
- **Super Admins**: Can delete all inquiries

## ✅ **After Applying the Fix**

1. **Inquiry deletion will work correctly**
2. **All related data (replies, attachments) will be deleted** (via CASCADE)
3. **No more "Failed to delete inquiry" errors**
4. **Proper database cleanup**

## 🧪 **Testing**

1. Apply the SQL fix in Supabase
2. Try deleting an inquiry from Studio Inbox
3. Verify it's actually removed from the database
4. Check that related replies/attachments are also deleted

## 📚 **Files Created**

- `scripts/fix-inquiries-delete-policy.sql` - Basic DELETE policies
- `scripts/fix-all-inbox-policies.sql` - Comprehensive policy fix
- `scripts/README-inbox-fix.md` - This documentation

## 🔗 **Related Files**

- `app/api/studio/inbox/[id]/route.ts` - DELETE endpoint (already fixed)
- `app/studio/inbox/page.tsx` - Frontend (already fixed)
- Database tables: `inquiries`, `inquiry_replies`, `inquiry_attachments`
