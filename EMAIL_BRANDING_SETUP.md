# OmaHub Email Branding Setup Guide

## Overview

This guide will help you configure custom OmaHub-branded emails for password resets, email confirmations, and user invitations instead of the default Supabase emails.

## 🎯 What This Fixes

- **Before**: Password reset emails come from "Supabase Auth" with generic branding
- **After**: Emails come from "OmaHub" with beautiful custom branding and messaging

## 📧 Custom Email Templates Created

We've created three custom email templates with OmaHub branding:

1. **Password Recovery** (`supabase/templates/recovery.html`)
2. **Email Confirmation** (`supabase/templates/confirmation.html`)
3. **User Invitation** (`supabase/templates/invite.html`)

## 🚀 Setup Instructions

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your OmaHub project: `gswduyodzdgucjscjtvz`
3. Navigate to **Authentication** → **Settings**

### Step 2: Configure Email Templates

#### Password Recovery Template

1. Scroll down to **Email Templates**
2. Click on **Reset Password** template
3. **Subject**: `Reset Your OmaHub Password`
4. **Body**: Copy the entire content from `supabase/templates/recovery.html`
5. Click **Save**

#### Email Confirmation Template

1. Click on **Confirm Signup** template
2. **Subject**: `Welcome to OmaHub - Confirm Your Email`
3. **Body**: Copy the entire content from `supabase/templates/confirmation.html`
4. Click **Save**

#### User Invitation Template

1. Click on **Invite User** template
2. **Subject**: `You're Invited to Join OmaHub`
3. **Body**: Copy the entire content from `supabase/templates/invite.html`
4. Click **Save**

### Step 3: Configure SMTP Settings (Optional but Recommended)

For production, you should configure custom SMTP to ensure better email deliverability:

1. In **Authentication** → **Settings**, scroll to **SMTP Settings**
2. Enable **Enable custom SMTP**
3. Configure with your preferred email service:

#### Option A: Using Resend (Recommended)

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: [Your Resend API Key]
Sender Name: OmaHub
Sender Email: noreply@omahub.com
```

#### Option B: Using SendGrid

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [Your SendGrid API Key]
Sender Name: OmaHub
Sender Email: noreply@omahub.com
```

### Step 4: Test the Setup

1. Go to your app's forgot password page
2. Enter your email address
3. Check your inbox - you should now receive a beautifully branded OmaHub email!

## 🎨 Email Design Features

Our custom templates include:

- **OmaHub branding** with logo and tagline
- **Brand colors** (OmaHub plum gradient)
- **Professional styling** with modern design
- **Mobile responsive** layout
- **Clear call-to-action** buttons
- **Security messaging** for user confidence
- **Proper footer** with links and copyright

## 🔧 Template Variables

The templates use Supabase's built-in variables:

- `{{ .ConfirmationURL }}` - The action link (reset password, confirm email, etc.)
- These are automatically populated by Supabase

## 📱 Testing Checklist

After setup, test these scenarios:

- [ ] Password reset email (should show OmaHub branding)
- [ ] New user signup confirmation (if email confirmation is enabled)
- [ ] User invitation email (if using invite functionality)

## 🚨 Troubleshooting

### Email Still Shows Supabase Branding

- Make sure you saved the templates in the dashboard
- Clear your browser cache
- Check that you copied the entire HTML content

### Emails Not Being Delivered

- Check spam/junk folder
- Verify SMTP configuration if using custom SMTP
- Check Supabase logs in the dashboard

### Template Not Loading

- Ensure HTML is valid (no syntax errors)
- Check that all template variables are properly formatted
- Verify the template was saved successfully

## 🎯 Next Steps

1. **Set up custom domain**: Configure a custom domain for even more professional emails
2. **Monitor email delivery**: Set up email analytics to track open rates
3. **A/B test templates**: Create variations to optimize engagement

## 📞 Support

If you encounter any issues:

1. Check the Supabase dashboard logs
2. Verify template HTML syntax
3. Test with different email providers
4. Contact Supabase support if needed

---

**Note**: These templates are already created in your `supabase/templates/` directory and ready to be copied into the Supabase Dashboard.
