# Quick Fix: Video Upload Issue in Spotlight Section

## 🚨 Issue Summary

You're getting "Failed to update spotlight content" errors with WebSocket connection failures when uploading videos to the spotlight section.

## 🛠️ Immediate Fix Steps

### Step 1: Apply Storage Policies in Supabase Dashboard

**Go to your Supabase Dashboard > SQL Editor and run this SQL:**

```sql
-- Fix video upload storage policies for spotlight-videos bucket
-- This will allow super_admin users to upload videos

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "spotlight-videos_public_select" ON storage.objects;
DROP POLICY IF EXISTS "spotlight-videos_super_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "spotlight-videos_super_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "spotlight-videos_super_admin_delete" ON storage.objects;

-- Create new comprehensive policies
-- Public read access (anyone can view spotlight videos)
CREATE POLICY "spotlight-videos_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'spotlight-videos');

-- Super admin insert access (only super admins can upload spotlight videos)
CREATE POLICY "spotlight-videos_super_admin_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'spotlight-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'super_admin'
  )
);

-- Super admin update access
CREATE POLICY "spotlight-videos_super_admin_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'spotlight-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'super_admin'
  )
);

-- Super admin delete access
CREATE POLICY "spotlight-videos_super_admin_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'spotlight-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role::text = 'super_admin'
  )
);
```

### Step 2: Verify Your User Role

**Run this query in Supabase Dashboard > SQL Editor:**

```sql
-- Check your current user role
SELECT id, email, role, created_at
FROM profiles
WHERE email = 'your-email@example.com';  -- Replace with your actual email
```

**Expected Result:** Your role should be `super_admin` to upload spotlight videos.

### Step 3: Fix WebSocket Connection Issues

The WebSocket errors are likely due to development server issues. **Restart your development server:**

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Check Storage Bucket Exists

**Run this in Supabase Dashboard > SQL Editor:**

```sql
-- Verify the spotlight-videos bucket exists
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'spotlight-videos';
```

**If the bucket doesn't exist, create it:**

```sql
-- Create the spotlight-videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'spotlight-videos',
  'spotlight-videos',
  true,
  104857600,  -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
);
```

## 🔍 Troubleshooting Steps

### If Video Upload Still Fails:

1. **Check Browser Console**

   - Open Developer Tools (F12)
   - Look for specific error messages
   - Check the Network tab for failed requests

2. **Verify File Requirements**

   - **File Size**: Must be under 50MB
   - **File Type**: MP4, WebM, or QuickTime only
   - **User Role**: Must be super_admin

3. **Test with Smaller File**
   - Try uploading a very small test video (under 5MB)
   - Use MP4 format for best compatibility

### If WebSocket Errors Persist:

1. **Clear Browser Cache**

   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache and cookies for localhost

2. **Check Development Server**

   - Restart the development server
   - Check if port 8898 is available
   - Try a different port if needed

3. **Environment Variables**
   - Ensure your `.env.local` has correct Supabase credentials
   - Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

## 🎯 Expected Behavior After Fix

1. **Video Upload**: Should work without database security errors
2. **WebSocket**: Connections should establish properly
3. **Spotlight Update**: Should save successfully with video URL

## 📞 If Issues Persist

If you're still having trouble after these steps:

1. **Share the specific error message** from browser console
2. **Confirm your user role** (should be super_admin)
3. **Check if the storage bucket exists** in Supabase dashboard
4. **Try uploading a very small test video** (under 5MB)

The main issue is likely that the storage policies haven't been applied yet. Once you run the SQL in Step 1, the video uploads should work properly.

---

**Quick Summary:**

1. Run the SQL policy fix in Supabase Dashboard
2. Verify you have super_admin role
3. Restart your development server
4. Try uploading again
