# New Account Notification System

## Overview

The new account notification system automatically detects when new users sign up and sends notifications to administrators. This helps keep track of user growth and enables quick response to new registrations.

## Components

### 1. Webhook Endpoint (`/api/webhooks/new-account`)

**Location**: `app/api/webhooks/new-account/route.ts`

**Purpose**: Receives notifications when new accounts are created and sends email alerts to administrators.

**Features**:

- Validates webhook requests with bearer token authentication
- Sends email notifications to configured admin emails
- Logs all new account creations
- Handles errors gracefully without affecting signup process

**Admin Emails**:

- eloka.agu@icloud.com
- shannonalisa@oma-hub.com
- eloka@satellitelabs.xyz

### 2. Enhanced Signup Process

**Location**: `app/api/auth/signup/route.ts`

**Enhancement**: The signup route now automatically triggers the new account notification webhook after successful profile creation.

**Flow**:

1. User submits signup form
2. Supabase creates auth user
3. Profile is created in database
4. Notification webhook is triggered
5. Admin emails are sent
6. User receives success response

### 3. Studio Dashboard Widget

**Location**: `app/studio/dashboard/RecentAccountsWidget.tsx`

**Purpose**: Displays recent account creations in the studio dashboard for admins and super admins.

**Features**:

- Shows last 10 accounts created in past 7 days
- Real-time updates every 30 seconds
- Color-coded roles and time indicators
- Fallback query when database view isn't available
- Direct link to full users management

### 4. Database Components

**Migration**: `supabase/migrations/20250108000000_add_new_account_notification.sql`

**Components**:

- Enhanced `create_profile_for_user()` trigger function
- `recent_account_creations` view for efficient queries
- `trigger_new_account_notification()` manual trigger function

## How It Works

### Automatic Flow (Production)

1. **User Signs Up**: New user completes signup form
2. **Database Trigger**: Supabase trigger creates profile and logs notification
3. **Application Notification**: Signup API calls webhook endpoint
4. **Email Alerts**: Webhook sends emails to all configured admins
5. **Dashboard Update**: Studio widget shows new account in real-time

### Manual Testing

You can manually trigger notifications using the test script:

```bash
node scripts/test-new-account-notification.js
```

### Email Template

The notification emails include:

- New user's email address
- Account creation timestamp
- User role (typically 'user')
- Direct link to studio users management

## Configuration

### Environment Variables

```env
WEBHOOK_SECRET=your-webhook-secret
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_SITE_URL=https://omahub.com
```

### Admin Email List

To modify admin emails, update the `ADMIN_EMAILS` array in:
`app/api/webhooks/new-account/route.ts`

## Security

- Webhook endpoint requires bearer token authentication
- Database functions use `SECURITY DEFINER` for controlled access
- Email sending is rate-limited and error-handled
- No sensitive user data is exposed in notifications

## Monitoring

### Studio Dashboard

Admins can monitor new accounts through:

- Recent Accounts widget (shows last 7 days)
- Full users management page
- Real-time updates and refresh capabilities

### Logs

All notifications are logged with:

- Timestamp of account creation
- User email and ID
- Success/failure of email sending
- Any errors encountered

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check RESEND_API_KEY configuration
2. **Widget not loading**: Verify database permissions and fallback query
3. **Webhook failures**: Check WEBHOOK_SECRET and endpoint availability

### Testing Commands

```bash
# Test the notification system
node scripts/test-new-account-notification.js

# Apply database components
node scripts/apply-new-account-notification.js

# Check recent accounts directly
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('profiles').select('email, created_at').order('created_at', {ascending: false}).limit(5).then(console.log);
"
```

## Future Enhancements

- Slack/Discord integration for instant notifications
- Customizable notification preferences per admin
- Weekly/monthly signup summary reports
- Integration with analytics dashboard
- User onboarding automation triggers

## Status

✅ **Working Components**:

- Webhook endpoint for notifications
- Email notification system
- Studio dashboard widget
- Application-level signup notifications

⏳ **Pending Database Migration**:

- Enhanced database trigger function
- Recent accounts database view
- Manual notification trigger function

The system is fully functional at the application level. Database enhancements will be applied when migrations are properly deployed.
