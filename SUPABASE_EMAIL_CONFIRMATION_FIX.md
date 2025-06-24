# Fix Email/Password Login Issue - Email Confirmation

## Problem

Users cannot login with email/password because email confirmation is enabled in Supabase, but emails are not being confirmed.

## Error Message

- "Email not confirmed"
- "Invalid login credentials"

## Solutions

### Solution 1: Disable Email Confirmation (Recommended for Development)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `gswduyodzdgucjscjtvz`
3. Navigate to **Authentication** → **Settings**
4. Scroll down to **Email Auth**
5. **Uncheck** "Enable email confirmations"
6. Click **Save**

### Solution 2: Configure Email Service (For Production)

If you want to keep email confirmation enabled:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your email service (Gmail, SendGrid, etc.)
3. Test email delivery
4. Users will receive confirmation emails

### Solution 3: Manually Confirm Test Users (Quick Fix)

For existing test users, you can manually confirm them:

1. Go to **Authentication** → **Users**
2. Find the user (test@omahub.com)
3. Click on the user
4. Toggle "Email Confirmed" to ON

## Testing After Fix

After disabling email confirmation, test the login:

```bash
# Test the API directly
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@omahub.com","password":"TestPassword123!"}'
```

Expected response:

```json
{
  "success": true,
  "user": {...},
  "session": {...}
}
```

## Create New Test User (After Fix)

```bash
node test-auth.js
```

This will create a new test user that can immediately login without email confirmation.

## Recommendation

For development, disable email confirmation to make testing easier. For production, set up proper email service and keep confirmation enabled for security.
