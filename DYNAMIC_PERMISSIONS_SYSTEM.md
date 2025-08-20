# Dynamic Permissions System

## Overview

The OmaHub platform has been completely refactored to use a **database-driven permissions system** instead of hardcoded email lists. This makes the system truly scalable, maintainable, and eliminates the need to manually update code when adding new admins or brand owners.

## 🎯 What Changed

### Before (Hardcoded System)
- ❌ Admin emails were hardcoded in multiple files
- ❌ Adding new admins required code changes and deployments
- ❌ Inconsistent permission checking across services
- ❌ Error-prone manual email management
- ❌ No single source of truth for user roles

### After (Dynamic System)
- ✅ **Database-driven**: All permissions read from `profiles` table
- ✅ **Real-time updates**: Changes in Studio immediately take effect
- ✅ **Single source of truth**: User management interface controls everything
- ✅ **Scalable**: Add unlimited admins without code changes
- ✅ **Consistent**: Same permission logic across all services

## 🏗️ Architecture

### Core Components

1. **`profiles` Table** - Single source of truth for user roles
2. **Permission Services** - Dynamic role and permission checking
3. **Studio User Management** - Super admin interface for managing users
4. **Fallback System** - Legacy support for existing hardcoded emails

### Data Flow

```
User Management Studio → profiles Table → Permission Services → UI/Access Control
```

## 🔧 How It Works

### 1. Database-First Permission Checking

```typescript
// NEW: Dynamic permission checking
async function getUserRoleFromDatabase(userId: string): Promise<Role | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
    
  return profile?.role as Role || null;
}
```

### 2. Fallback to Legacy System

```typescript
// FALLBACK: Only used when database lookup fails
function getLegacyUserRole(email: string): string {
  const legacySuperAdmins = [
    "eloka.agu@icloud.com",
    "shannonalisa@oma-hub.com",
    "nnamdiohaka@gmail.com",
  ];
  // ... other legacy logic
}
```

### 3. Real-Time Permission Updates

When a super admin changes a user's role in the Studio:
1. **Immediate**: Database is updated
2. **Real-time**: Permission services read new role
3. **No restart**: Changes take effect immediately
4. **No deployment**: All changes are live

## 📊 User Management Workflow

### Adding a New Brand Admin

1. **Go to Studio → Users** (super admin only)
2. **Click "Add User"**
3. **Enter email and select "Brand Admin" role**
4. **Assign brands** they can manage
5. **Save** - User immediately gets studio access

### Changing User Roles

1. **Find user** in the Users list
2. **Click "Edit"**
3. **Change role** using dropdown
4. **Update brand assignments** if needed
5. **Save** - Changes take effect immediately

### Removing Admin Access

1. **Edit user** in Studio
2. **Change role** to "User"
3. **Remove brand assignments**
4. **Save** - User loses studio access immediately

## 🔐 Permission Levels

### User Roles

| Role | Studio Access | Brand Management | Catalogue Management | Product Management | Settings | User Management |
|------|---------------|------------------|---------------------|-------------------|----------|-----------------|
| `user` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `brand_admin` | ✅ | ✅ (Own brands only) | ✅ (Own brands only) | ✅ (Own brands only) | ❌ | ❌ |
| `admin` | ✅ | ✅ (All brands) | ✅ (All brands) | ❌ | ❌ | ❌ |
| `super_admin` | ✅ | ✅ (All brands) | ✅ (All brands) | ✅ (All brands) | ✅ | ✅ |

### Brand-Specific Access

- **Brand Admins**: Can only access brands in their `owned_brands` array
- **Admins**: Can access all brands but limited permissions
- **Super Admins**: Full access to everything

## 🚀 Benefits

### For Developers
- **No more hardcoded emails** to maintain
- **Single source of truth** for user roles
- **Consistent permission logic** across services
- **Easier testing** and debugging
- **Scalable architecture** for future growth

### For Super Admins
- **Real-time user management** without code changes
- **Immediate permission updates** when changing roles
- **Centralized user control** in Studio interface
- **No deployment delays** for admin changes
- **Audit trail** of role changes

### For Brand Owners
- **Immediate access** when roles are assigned
- **No waiting** for code deployments
- **Consistent experience** across the platform
- **Proper brand isolation** based on assignments

## 🔄 Migration Strategy

### Phase 1: Database-Driven Primary (✅ Complete)
- All permission services now read from database first
- Legacy email fallbacks maintained for backward compatibility
- No breaking changes to existing functionality

### Phase 2: Legacy Cleanup (Future)
- Remove hardcoded email lists once confident in new system
- Clean up fallback code
- Optimize permission checking performance

### Phase 3: Advanced Features (Future)
- Role-based permission templates
- Time-limited admin access
- Audit logging for permission changes
- Bulk user role management

## 🧪 Testing the System

### Test Scenarios

1. **New Brand Admin Creation**
   - Create new user with brand_admin role
   - Verify immediate studio access
   - Test brand-specific permissions

2. **Role Changes**
   - Change user from user to brand_admin
   - Verify immediate permission updates
   - Test brand access restrictions

3. **Brand Assignment**
   - Assign/unassign brands to brand admins
   - Verify immediate access changes
   - Test brand isolation

4. **Fallback System**
   - Test with legacy hardcoded emails
   - Verify fallback works when database fails
   - Ensure no breaking changes

## 🚨 Troubleshooting

### Common Issues

1. **User not getting studio access**
   - Check if profile exists in database
   - Verify role is set correctly
   - Check brand assignments for brand admins

2. **Permission changes not taking effect**
   - Ensure user is signed out and back in
   - Check browser cache and refresh
   - Verify database changes were saved

3. **Fallback not working**
   - Check if legacy email lists are maintained
   - Verify fallback functions are called
   - Check console logs for errors

### Debug Information

All permission services now include comprehensive logging:
- Database lookup results
- Fallback usage
- Permission calculations
- Error handling

## 📝 Code Examples

### Checking Permissions

```typescript
import { hasPermission } from '@/lib/services/permissionsService';

// Check if user can access studio
const canAccessStudio = await hasPermission(userId, 'studio.access');

// Check if user can manage brands
const canManageBrands = await hasPermission(userId, 'studio.brands.manage');
```

### Getting User Role

```typescript
import { getUserRole } from '@/lib/services/permissionsService';

// Get current user role
const userRole = await getUserRole(userId);

// Check specific role
if (userRole === 'super_admin') {
  // Show admin features
}
```

### Getting All Permissions

```typescript
import { getUserPermissions } from '@/lib/services/permissionsService';

// Get all permissions for user
const permissions = await getUserPermissions(userId);

// Check multiple permissions
const hasFullAccess = permissions.includes('studio.settings.manage') && 
                     permissions.includes('studio.users.manage');
```

## 🎉 Conclusion

The new dynamic permissions system transforms OmaHub from a hardcoded, maintenance-heavy system to a flexible, scalable platform where:

- **Super admins** can manage users in real-time
- **Developers** don't need to maintain email lists
- **Users** get immediate access when roles change
- **The system** scales automatically with your needs

This is a fundamental improvement that makes OmaHub truly enterprise-ready and maintainable for the long term.
