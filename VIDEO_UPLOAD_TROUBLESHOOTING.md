# Video Upload Troubleshooting Guide

## Issue: Database Security Policy Blocked Video Upload

### Problem Description

When trying to upload a video to the spotlight section, users encounter the error:

> "Database security policy blocked the upload. Please contact support."

### Root Cause Analysis

The issue is caused by restrictive Row Level Security (RLS) policies on the Supabase storage buckets that prevent video uploads. The policies are either:

1. Not properly configured for video buckets
2. Too restrictive for the current user's role
3. Missing required permissions for video file types

### Quick Fix Steps

#### Step 1: Apply Storage Policy Fix

Run the SQL script in your Supabase Dashboard > SQL Editor:

```sql
-- Copy and paste the contents of scripts/fix-video-upload-policies.sql
```

#### Step 2: Verify Your Role

Check your current user role in Supabase Dashboard > SQL Editor:

```sql
SELECT id, email, role, created_at
FROM profiles
WHERE id = auth.uid();
```

**Required Roles for Video Upload:**

- **Spotlight Videos**: `super_admin` only
- **Product Videos**: `super_admin`, `admin`, or `brand_admin`

#### Step 3: Test the Fix

Run the diagnostic script:

```bash
node scripts/test-video-upload-permissions.js
```

### Detailed Solutions

#### Solution 1: Fix Storage Policies (Recommended)

1. **Navigate to Supabase Dashboard**

   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the sidebar

2. **Run the Policy Fix Script**

   ```sql
   -- Copy the entire contents of scripts/fix-video-upload-policies.sql
   -- Paste into SQL Editor and click "Run"
   ```

3. **Verify Policies Were Created**
   The script includes verification queries that will show the created policies.

#### Solution 2: Check User Permissions

1. **Verify Your Role**

   ```sql
   SELECT id, email, role FROM profiles WHERE id = auth.uid();
   ```

2. **Update Role if Needed** (Super Admin Only)
   ```sql
   UPDATE profiles
   SET role = 'super_admin'
   WHERE email = 'your-email@domain.com';
   ```

#### Solution 3: Recreate Storage Buckets (Last Resort)

If policies don't work, recreate the buckets:

```bash
node scripts/setup-all-storage-buckets.js
```

### Prevention Steps

#### For Administrators

1. **Regular Policy Audits**

   - Review storage policies monthly
   - Test upload functionality with different user roles
   - Monitor error logs for policy violations

2. **User Role Management**

   - Ensure proper roles are assigned
   - Document who has video upload permissions
   - Regular cleanup of unused accounts

3. **Backup Policies**
   - Keep a backup of working storage policies
   - Version control policy changes
   - Test in staging before production

#### For Developers

1. **Error Handling**

   - Implement proper error messages for policy violations
   - Add user-friendly feedback for permission issues
   - Log detailed errors for debugging

2. **Permission Checks**
   - Validate user permissions before showing upload UI
   - Provide clear messaging about required roles
   - Implement graceful degradation for unauthorized users

### Testing Checklist

Before deploying video upload features:

- [ ] Storage buckets exist and are accessible
- [ ] Policies allow appropriate user roles
- [ ] Video file types are supported (MP4, WebM, QuickTime)
- [ ] File size limits are reasonable (50MB for videos)
- [ ] Error handling works correctly
- [ ] UI shows appropriate messages for different user roles

### Common Error Messages and Solutions

#### "Database security policy blocked the upload"

- **Cause**: User doesn't have required role or policies are too restrictive
- **Solution**: Apply policy fix script and verify user role

#### "Profile check failed"

- **Cause**: User profile doesn't exist or can't be accessed
- **Solution**: Ensure user has completed profile setup

#### "Only super admins can upload spotlight videos"

- **Cause**: User trying to upload to spotlight-videos without super_admin role
- **Solution**: Either upgrade user role or use product-videos bucket

#### "mime type image/jpeg is not supported"

- **Cause**: Trying to upload image to video bucket
- **Solution**: Use correct bucket (spotlight-images for images, spotlight-videos for videos)

### File Structure

```
scripts/
├── fix-video-upload-policies.sql          # Main policy fix
├── test-video-upload-permissions.js       # Diagnostic script
└── setup-all-storage-buckets.js          # Bucket setup script

components/ui/
├── video-upload.tsx                       # Video upload component
└── video-player.tsx                      # Video player component

app/studio/spotlight/
├── create/page.tsx                        # Spotlight creation with video
└── [id]/page.tsx                         # Spotlight editing with video
```

### Support Information

If the issue persists after following these steps:

1. **Check Browser Console**

   - Look for detailed error messages
   - Check network tab for failed requests
   - Note any CORS or authentication errors

2. **Verify Environment**

   - Ensure NEXT_PUBLIC_SUPABASE_URL is correct
   - Check SUPABASE_SERVICE_ROLE_KEY is set
   - Verify user is properly authenticated

3. **Contact Support**
   - Provide error messages from browser console
   - Include user email and role
   - Mention steps already attempted

### Version History

- **v1.0**: Initial video upload implementation
- **v1.1**: Added comprehensive error handling
- **v1.2**: Fixed storage policy issues
- **v1.3**: Added troubleshooting guide and diagnostic tools

### Related Documentation

- [Video Capability Implementation](VIDEO_CAPABILITY_IMPLEMENTATION.md)
- [Storage Bucket Setup](scripts/setup-all-storage-buckets.js)
- [User Role Management](docs/user-role-management.md)
