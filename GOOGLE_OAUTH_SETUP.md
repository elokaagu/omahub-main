# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your OmaHub application.

## Prerequisites

- Google Cloud Console account
- Supabase project
- Your application deployed or running locally

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: OmaHub
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Save and continue

### 1.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Set the name: "OmaHub Web Client"
5. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://gswduyodzdgucjscjtvz.supabase.co/auth/v1/callback
   https://your-production-domain.com/auth/callback
   ```
6. Click **Create**
7. **Important**: Copy the Client ID and Client Secret

## Step 2: Supabase Configuration

### 2.1 Configure Google Provider in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** and click **Configure**
5. Enable the Google provider
6. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
7. Set the redirect URL to: `https://gswduyodzdgucjscjtvz.supabase.co/auth/v1/callback`
8. Save the configuration

### 2.2 Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gswduyodzdgucjscjtvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 3: Local Development Setup

### 3.1 Update Supabase Local Config

The `supabase/config.toml` file has been updated with Google OAuth configuration:

```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = ""
skip_nonce_check = false
```

### 3.2 Start Local Development

1. Make sure your `.env.local` file has the correct values
2. Run `npm run dev`
3. Test Google OAuth at `http://localhost:3000/login`

## Step 4: Production Deployment

### 4.1 Vercel Environment Variables

In your Vercel dashboard, add these environment variables:

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_SUPABASE_URL=https://gswduyodzdgucjscjtvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4.2 Update Google Cloud Console

Add your production domain to the authorized redirect URIs:

```
https://your-production-domain.com/auth/callback
```

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**

   - Check that all redirect URIs are exactly matching in Google Cloud Console
   - Make sure there are no trailing slashes

2. **"invalid_client" error**

   - Verify Client ID and Client Secret are correct
   - Check that the OAuth consent screen is properly configured

3. **"access_denied" error**

   - User cancelled the OAuth flow
   - Check OAuth consent screen configuration

4. **No response from Google**
   - Check that Google+ API is enabled
   - Verify OAuth consent screen is published (not in testing mode)

### Debug Mode

The application now includes enhanced logging. Check the browser console for detailed OAuth flow information:

- `🔐 Starting OAuth sign-in with google`
- `🔗 Using redirect URL: ...`
- `✅ OAuth sign-in initiated successfully`
- `❌ Error details if something goes wrong`

### Error Page

If OAuth fails, users will be redirected to `/auth/auth-code-error` with detailed error information.

## Testing

1. Go to your login page
2. Click "Continue with Google"
3. You should be redirected to Google's OAuth consent screen
4. After granting permission, you should be redirected back and logged in

## Security Notes

- Never commit OAuth secrets to version control
- Use environment variables for all sensitive data
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all redirect URIs are correctly configured
3. Ensure environment variables are properly set
4. Check Supabase logs for authentication errors
