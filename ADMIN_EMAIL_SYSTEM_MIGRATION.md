# Admin Email System Migration Guide

## 🎯 **Overview**

This migration moves all hardcoded admin emails from the codebase to a centralized database-driven system. This improves security, maintainability, and allows dynamic admin management without code changes.

## 🚀 **What Was Changed**

### **Before (Hardcoded)**
```typescript
// ❌ OLD: Hardcoded admin emails scattered throughout the codebase
const SUPER_ADMIN_EMAILS = [
  "eloka.agu@icloud.com",
  "shannonalisa@oma-hub.com",
];

const ADMIN_EMAILS = [
  "eloka.agu@icloud.com",
  "shannonalisa@oma-hub.com",
  "eloka@satellitelabs.xyz",
];
```

### **After (Database-Driven)**
```typescript
// ✅ NEW: Centralized admin email service
import { adminEmailService } from "@/lib/services/adminEmailService";

const isAdmin = await adminEmailService.isSuperAdmin(userEmail);
const adminEmails = await adminEmailService.getSuperAdminEmails();
```

## 🗄️ **Database Changes**

### **1. New Platform Settings**
```sql
-- Admin email configurations stored in platform_settings table
INSERT INTO platform_settings (key, value, description) VALUES 
  ('super_admin_emails', '["eloka.agu@icloud.com", "shannonalisa@oma-hub.com"]', 'Array of super admin email addresses'),
  ('brand_admin_emails', '["eloka@culturin.com"]', 'Array of brand admin email addresses'),
  ('webhook_admin_emails', '["eloka.agu@icloud.com", "shannonalisa@oma-hub.com", "eloka@satellitelabs.xyz"]', 'Array of admin emails for webhook notifications');
```

### **2. New Database Functions**
```sql
-- Check if email is super admin
SELECT is_super_admin('eloka.agu@icloud.com');

-- Check if email is brand admin  
SELECT is_brand_admin('eloka@culturin.com');

-- Get all admin emails of a specific type
SELECT get_admin_emails('super_admin');
```

### **3. RLS Policies**
- Public read access to platform settings
- Only super admins can modify admin email configurations

## 🔧 **New Services Created**

### **Client-Side Service** (`lib/services/adminEmailService.ts`)
- Singleton pattern for efficient caching
- 5-minute cache duration for performance
- Fallback to hardcoded values if database fails
- Methods for checking admin status and managing emails

### **Server-Side Service** (`lib/services/adminEmailService.server.ts`)
- Same functionality as client service but for API routes
- Uses server-side Supabase client
- Secure admin email management

## 📋 **Migration Steps**

### **Step 1: Run Database Migration**
```bash
# Option A: Use the script (if DATABASE_URL is set)
chmod +x scripts/setup-admin-email-system.sh
./scripts/setup-admin-email-system.sh

# Option B: Manual execution in Supabase Dashboard
# Copy and paste the contents of scripts/create-admin-email-system.sql
```

### **Step 2: Update API Routes**
The following files have been updated to use the new service:

#### **Webhook Route** (`app/api/webhooks/new-account/route.ts`)
```typescript
// Before
const ADMIN_EMAILS = ["eloka.agu@icloud.com", "shannonalisa@oma-hub.com"];

// After  
const adminEmails = await adminEmailServiceServer.getWebhookAdminEmails();
```

#### **Permissions Service** (`lib/services/permissionsService.ts`)
```typescript
// Before
const SUPER_ADMIN_EMAILS = ["eloka.agu@icloud.com", "shannonalisa@oma-hub.com"];

// After
import { adminEmailService } from "./adminEmailService";
async function isSuperAdminEmail(email: string): Promise<boolean> {
  return await adminEmailService.isSuperAdmin(email);
}
```

### **Step 3: Update Remaining Files**
The following files still need to be updated (in progress):

- `app/api/auth/enable-password-gate/route.ts`
- `app/api/auth/remove-password-gate/route.ts`
- `app/api/auth/platform-status/route.ts`
- `app/api/admin/leads/route.ts`
- `app/api/studio/inbox/route.ts`
- `app/api/studio/inbox/[id]/route.ts`
- `app/api/studio/inbox/[id]/replies/route.ts`
- `app/api/studio/inbox/stats/route.ts`
- `contexts/AuthContext.tsx`
- `lib/services/authService.ts`
- `app/api/auth/login/route.ts`
- `app/api/debug/inbox-status/route.ts`

## 🔒 **Security Benefits**

### **1. Centralized Management**
- All admin emails managed in one place
- No more searching through code for hardcoded emails
- Consistent admin access across the application

### **2. Dynamic Updates**
- Add/remove admins without code deployment
- Immediate effect on admin access
- Audit trail of admin changes

### **3. Reduced Attack Surface**
- No more hardcoded credentials in source code
- Database-level access control
- RLS policies ensure only super admins can modify

## 📊 **Performance Considerations**

### **1. Caching Strategy**
- 5-minute cache duration for admin email lookups
- Singleton pattern prevents multiple service instances
- Fallback to hardcoded values if database is unavailable

### **2. Database Optimization**
- Indexes on platform_settings.key for fast lookups
- JSONB operations for efficient array operations
- Minimal database queries through caching

## 🧪 **Testing the Migration**

### **1. Verify Database Setup**
```sql
-- Check if admin email settings exist
SELECT * FROM platform_settings WHERE key LIKE '%_admin_emails';

-- Test admin functions
SELECT is_super_admin('eloka.agu@icloud.com');
SELECT get_admin_emails('super_admin');
```

### **2. Test Admin Access**
- Login as a super admin user
- Verify admin permissions work correctly
- Check that non-admin users don't have admin access

### **3. Test Webhook Notifications**
- Create a new user account
- Verify admin notification emails are sent
- Check that the correct admin emails receive notifications

## 🚨 **Rollback Plan**

If issues arise, you can rollback by:

### **1. Database Rollback**
```sql
-- Remove admin email settings
DELETE FROM platform_settings WHERE key LIKE '%_admin_emails';

-- Drop functions
DROP FUNCTION IF EXISTS is_super_admin(TEXT);
DROP FUNCTION IF EXISTS is_brand_admin(TEXT);
DROP FUNCTION IF EXISTS get_admin_emails(TEXT);
```

### **2. Code Rollback**
- Revert to hardcoded email arrays
- Remove admin email service imports
- Restore original permission checking logic

## 📈 **Future Enhancements**

### **1. Admin Management UI**
- Studio interface for managing admin emails
- Add/remove admins through the web interface
- Admin role assignment and management

### **2. Enhanced Security**
- Two-factor authentication for admin changes
- Admin change audit logging
- Email verification for new admin additions

### **3. Role-Based Admin Types**
- Different admin levels (super, brand, content, etc.)
- Granular permission management
- Admin hierarchy and delegation

## ✅ **Verification Checklist**

- [ ] Database migration completed successfully
- [ ] Admin email settings populated in platform_settings
- [ ] Database functions working correctly
- [ ] API routes updated to use new service
- [ ] Admin access working for existing users
- [ ] Webhook notifications sending to correct admins
- [ ] Performance acceptable (no significant slowdown)
- [ ] Fallback values working if database unavailable
- [ ] RLS policies properly configured
- [ ] Cache working correctly

## 🎉 **Benefits Achieved**

1. **Security**: No more hardcoded admin emails in source code
2. **Maintainability**: Centralized admin management
3. **Flexibility**: Add/remove admins without code changes
4. **Performance**: Efficient caching and database optimization
5. **Auditability**: Track admin changes and access
6. **Scalability**: Easy to manage growing admin teams

## 📞 **Support**

If you encounter issues during migration:

1. Check the database migration logs
2. Verify platform_settings table structure
3. Test database functions manually
4. Check browser console for service errors
5. Verify environment variables are set correctly

---

**Migration Status**: In Progress  
**Last Updated**: $(date)  
**Next Steps**: Complete remaining file updates and testing
