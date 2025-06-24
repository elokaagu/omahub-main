# Brand Owner Access Controls in OmaHub Studio

## Overview

Brand owners (`brand_admin` role) have restricted access to the OmaHub Studio, ensuring they can only see and manage information relevant to their specific brands. This document outlines what they can access and the security controls in place.

## What Brand Owners Can Access

### ✅ **Dashboard**

- **LeadsTrackingDashboard**: Shows only leads, analytics, and metrics for their owned brands
- **Analytics**: Revenue, conversion rates, and performance data filtered by their brands only
- **Recent Leads**: Only leads that contacted their brands
- **No access to**: Overall platform analytics, competitor data, or other brands' performance

### ✅ **Brands Management**

- **View**: Only their owned brands
- **Edit**: Only their owned brands (name, description, category, location, images, etc.)
- **Delete**: Only their owned brands
- **No access to**: Other brands' information or management

### ✅ **Catalogues**

- **View**: Only catalogues belonging to their owned brands
- **Create**: New catalogues for their owned brands only
- **Edit**: Only catalogues from their owned brands
- **Delete**: Only catalogues from their owned brands
- **No access to**: Other brands' catalogues

### ✅ **Products**

- **View**: Only products from their owned brands
- **Create**: New products for their owned brands only
- **Edit**: Only products from their owned brands
- **Delete**: Only products from their owned brands
- **No access to**: Other brands' products or inventory

### ✅ **Leads Management**

- **View**: Only leads that contacted their owned brands
- **Manage**: Lead status, priority, and interactions for their brands only
- **Analytics**: Lead conversion and performance data for their brands only
- **No access to**: Leads from other brands, competitor customer data

### ✅ **Inbox**

- **View**: Only inquiries sent to their owned brands
- **Reply**: Can respond to inquiries for their brands
- **Manage**: Mark as read, replied, or closed for their brand inquiries only
- **No access to**: Inquiries sent to other brands

### ✅ **Reviews**

- **View**: Only reviews for their owned brands
- **Reply**: Can respond to reviews of their brands
- **Manage**: Can delete inappropriate reviews of their brands
- **No access to**: Reviews of other brands

### ✅ **Profile Management**

- **Edit**: Their own profile information
- **Update**: Contact details, preferences, and account settings

## What Brand Owners CANNOT Access

### ❌ **Super Admin Features**

- Hero Carousel Management
- Spotlight Management
- User Management
- Platform Settings
- System-wide Analytics

### ❌ **Other Brands' Data**

- Competitor brand information
- Other brands' products or catalogues
- Other brands' customer leads or inquiries
- Other brands' reviews or ratings
- Other brands' financial or performance data

### ❌ **Platform-wide Information**

- Overall platform analytics
- Other users' accounts or profiles
- System logs or administrative functions
- Commission structures or financial settings

## Security Implementation

### **Multi-Layer Access Control**

1. **Role-Based Permissions**

   ```typescript
   // Brand admins have specific permissions
   brand_admin: [
     "studio.access",
     "studio.brands.manage",
     "studio.catalogues.manage",
     "studio.catalogues.create",
     "studio.products.manage",
   ];
   ```

2. **Database-Level Filtering**

   - API endpoints filter data by `owned_brands` array in user profile
   - Supabase RLS policies enforce brand ownership
   - Server-side validation prevents unauthorized access

3. **Component-Level Filtering**

   ```typescript
   // Example: LeadsTrackingDashboard
   if (isBrandAdmin && effectiveOwnedBrands.length > 0) {
     filteredLeads = filteredLeads.filter((lead: Lead) =>
       effectiveOwnedBrands.includes(lead.brand_id)
     );
   }
   ```

4. **API Route Protection**
   ```typescript
   // All admin APIs check user role and owned brands
   if (profile.role === "brand_admin") {
     if (!profile.owned_brands?.includes(brandId)) {
       return NextResponse.json(
         { error: "Access denied to this brand" },
         { status: 403 }
       );
     }
   }
   ```

### **Navigation Restrictions**

Brand owners see customized navigation labels:

- "Your Brands" instead of "Brands"
- "Your Catalogues" instead of "Catalogues"
- "Your Products" instead of "Products"
- "Your Reviews" instead of "Reviews"
- "Your Inbox" instead of "Inbox"

### **Data Isolation**

- **Leads**: Filtered by `brand_id` in `owned_brands` array
- **Inquiries**: Filtered by `brand_id` in `owned_brands` array
- **Reviews**: Filtered by `brand_id` in `owned_brands` array
- **Products**: Filtered by `brand_id` in `owned_brands` array
- **Catalogues**: Filtered by `brand_id` in `owned_brands` array
- **Analytics**: Calculated only from their brand data

## Technical Implementation

### **Key Files Modified**

- `components/studio/LeadsTrackingDashboard.tsx` - Added brand filtering
- `app/studio/page.tsx` - Pass user role and owned brands to components
- `app/studio/leads/page.tsx` - Enhanced brand ownership filtering
- `app/api/admin/leads/route.ts` - Server-side brand filtering (already implemented)
- `app/api/admin/reviews/route.ts` - Review access control (already implemented)
- `app/studio/inbox/page.tsx` - Inbox filtering (already implemented)

### **Access Control Flow**

1. User authenticates and role is determined
2. User profile fetched with `owned_brands` array
3. All API calls filtered by owned brands
4. Components receive filtered data only
5. UI shows brand-specific labels and options

### **Error Handling**

- Graceful degradation when no owned brands exist
- Clear error messages for unauthorized access attempts
- Logging of access control decisions for security auditing

## Verification

To verify brand owner access controls:

1. **Login as brand owner** (`brand_admin` role)
2. **Check dashboard** - Should only show data for owned brands
3. **Navigate to leads** - Should only see leads for owned brands
4. **Check inbox** - Should only see inquiries for owned brands
5. **View products** - Should only see products from owned brands
6. **Attempt to access** super admin features - Should be denied

## Future Enhancements

- **Audit Logging**: Track all brand owner actions for compliance
- **Advanced Permissions**: Granular permissions per brand feature
- **Multi-Brand Management**: Enhanced UI for users owning multiple brands
- **Brand Collaboration**: Allow controlled data sharing between partner brands
