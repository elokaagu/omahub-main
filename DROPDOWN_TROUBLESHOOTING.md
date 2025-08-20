# Dropdown Troubleshooting Guide

## Issue: Role Dropdown Not Working in Edit User Modal

### Symptoms

- Dropdown shows "Brand Admin" but won't open when clicked
- No dropdown options appear
- Dropdown appears "stuck" or unresponsive

### Root Cause

The issue is a **z-index conflict** between the Dialog modal and the Select dropdown:

- **Dialog overlay**: `z-[1001]` (very high)
- **Select dropdown**: `z-50` (much lower)
- **Result**: Dropdown renders behind the modal overlay, making it unclickable

### Fixes Applied

#### 1. Z-Index Fix (Primary Solution)

Updated the Select component to use `z-[1002]` to ensure it appears above Dialog overlays.

#### 2. Positioning Improvements

Added `side="bottom"` and `sideOffset={4}` to the SelectContent for better positioning.

#### 3. Debug Logging

Added console logging to help troubleshoot any remaining issues.

### Testing the Fix

1. **Refresh the page** to load the updated Select component
2. **Open the Edit User modal** for the user who needs role changes
3. **Click on the Role dropdown** - it should now open properly
4. **Select "Brand Admin"** from the dropdown options
5. **Assign the user to their specific brand(s)**
6. **Save the changes**

### If the Issue Persists

#### Check Browser Console

1. Open Developer Tools (F12)
2. Go to Console tab
3. Click the dropdown and look for any error messages
4. You should see "SelectTrigger clicked" when you click the dropdown

#### Alternative Solution: Use Radio Buttons

If the dropdown still doesn't work, use the fallback radio buttons below the Select component.

#### Check for JavaScript Errors

Look for any red error messages in the console that might indicate other issues.

### Technical Details

#### Files Modified

- `components/ui/select.tsx` - Updated z-index from z-50 to z-[1002]
- `app/studio/users/page.tsx` - Added positioning props and debug logging

#### Z-Index Hierarchy

- Dialog overlay: `z-[1001]`
- Select dropdown: `z-[1002]` (now higher)
- Other UI elements: `z-50` or lower

### Prevention

This fix ensures that all Select components throughout the application will work properly within Dialog modals, preventing similar issues in the future.

### Support

If the issue persists after applying these fixes:

1. Check browser console for errors
2. Verify the page has been refreshed
3. Try using the fallback radio buttons
4. Check if there are any CSS conflicts in the browser's Elements tab
