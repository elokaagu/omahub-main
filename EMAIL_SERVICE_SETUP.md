# Email Service Setup Guide

## Issue: Inbox Reply Emails Not Sending

The inbox reply functionality is failing because the email service (Resend) is not properly configured. When users try to reply to customer inquiries from the studio inbox, they see "Failed to send reply" error.

## Root Cause

The `RESEND_API_KEY` environment variable is missing from the deployment configuration, causing the email service to fail when trying to send reply emails to customers.

## Solution: Setup Resend Email Service

### Step 1: Create Resend Account

1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up for a free account (3,000 emails/month free tier)
3. Verify your email address

### Step 2: Add Domain (Optional but Recommended)

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain: `oma-hub.com`
4. Add the provided DNS records to your domain provider:
   - **TXT Record**: `v=spf1 include:_spf.resend.com ~all`
   - **CNAME Record**: `resend._domainkey` → `resend._domainkey.resend.com`
   - **MX Record**: `10 feedback-smtp.resend.com`
5. Click "Verify Domain" once DNS records are added

### Step 3: Create API Key

1. In Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Name it "OmaHub Production"
4. Select "Sending access" (sufficient for email sending)
5. **Important**: Copy the API key immediately (it won't be shown again)

### Step 4: Configure Environment Variables

Add the following environment variable to your deployment:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
```

#### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add new variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (starts with `re_`)
   - **Environment**: Production, Preview, Development

#### For Local Development:

Add to your `.env.local` file:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Deploy Changes

After adding the environment variable, trigger a new deployment to apply the changes.

## Verification

### Test Email Sending

You can test if the email service is working by:

1. Going to the studio inbox
2. Opening any customer inquiry
3. Trying to send a reply
4. The customer should receive the email reply

### Check Logs

Monitor the application logs for:

- ✅ "Reply email sent successfully to: [email]"
- ❌ "Resend API key not configured"
- ❌ "Failed to send reply email"

## Email Templates

The system uses a beautiful HTML email template that includes:

- **Professional branding** with OmaHub colors
- **Original message context** so customers remember their inquiry
- **Reply message** from the admin/brand
- **Call-to-action** to continue the conversation
- **Footer** with brand attribution

## Current Email Configuration

The system is configured to send emails:

- **From**: `{Brand Name} via OmaHub <info@oma-hub.com>`
- **To**: Customer's email address
- **Subject**: `Re: {Original Subject}`
- **Reply-To**: Customer's email (enables direct replies)

## Troubleshooting

### Common Issues

1. **"Failed to send reply"**

   - Check if `RESEND_API_KEY` is configured
   - Verify the API key is valid and not expired
   - Check Resend dashboard for sending limits

2. **Emails going to spam**

   - Verify domain DNS records are properly configured
   - Consider upgrading to dedicated IP (paid plan)
   - Check email content for spam triggers

3. **API key not working**
   - Ensure the key starts with `re_`
   - Check if the key has proper permissions
   - Verify the key hasn't been deleted from Resend dashboard

### Debug Steps

1. Check environment variables in deployment
2. Monitor application logs during email sending
3. Check Resend dashboard for email delivery status
4. Test with a simple email first

## Alternative Email Providers

If you prefer not to use Resend, the email service can be modified to work with:

- **SendGrid**
- **Mailgun**
- **Amazon SES**
- **Postmark**

The current implementation uses Resend because it offers:

- ✅ Generous free tier (3,000 emails/month)
- ✅ Excellent developer experience
- ✅ Beautiful email templates with React
- ✅ Reliable delivery rates
- ✅ Detailed analytics and logs

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Regularly rotate API keys for security
- Monitor email sending for unusual activity

## Cost Considerations

**Resend Free Tier**:

- 3,000 emails/month
- 100 emails/day
- Shared IP pool
- Basic analytics

**Paid Plans** (if needed):

- Start at $20/month for 50,000 emails
- Dedicated IP addresses
- Advanced analytics
- Priority support

## Support

If you continue to experience issues:

1. Check the Resend status page: [https://status.resend.com](https://status.resend.com)
2. Review Resend documentation: [https://resend.com/docs](https://resend.com/docs)
3. Contact Resend support for delivery issues
4. Check application logs for detailed error messages

---

**Status**: ⚠️ **Action Required** - Email service needs to be configured with Resend API key

**Priority**: 🔴 **High** - Customer communication is affected

**Estimated Setup Time**: 15-30 minutes
