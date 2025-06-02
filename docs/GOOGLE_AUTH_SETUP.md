# Google Authentication Setup Guide

This guide walks you through setting up Google Sign-In for your OmaHub application.

## 🔧 Prerequisites

- Google Cloud Console account
- Supabase project with authentication enabled
- Next.js application with Supabase configured

## 📋 Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 1.3 Configure OAuth Consent Screen (IMPORTANT for Branding)

**This step is crucial to show "OmaHub" instead of the Supabase project ID**

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (unless you have Google Workspace)
3. Click **Create**

#### OAuth Consent Screen Configuration:

**App Information:**

- **App name**: `OmaHub`
- **User support email**: Your email address
- **App logo**: Upload your OmaHub logo (optional but recommended)
- **App domain**: Your website domain (e.g., `omahub.com`)

**App Domain (Optional but recommended):**

- **Application home page**: `https://yourdomain.com`
- **Application privacy policy link**: `https://yourdomain.com/privacy`
- **Application terms of service link**: `https://yourdomain.com/terms`

**Authorized Domains:**
Add these domains:

- `yourdomain.com` (your production domain)
- `supabase.co` (required for Supabase auth)
- `localhost` (for development)

**Developer Contact Information:**

- Add your email address

4. Click **Save and Continue**

#### Scopes Configuration:

1. Click **Add or Remove Scopes**
2. Add these scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
3. Click **Update** then **Save and Continue**

#### Test Users (for development):

1. Add your email and any test user emails
2. Click **Save and Continue**

#### Summary:

1. Review your configuration
2. Click **Back to Dashboard**

### 1.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. For Application type, select **Web application**
4. **Name**: `OmaHub Web Client`
5. Add **Authorized JavaScript origins**:
   ```
   https://yourdomain.com
   http://localhost:3000
   ```
6. Add **Authorized redirect URIs**:
   ```
   https://gswduyodzdgucjscjtvz.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```
7. Click **Create**
8. Save your **Client ID** and **Client Secret**

## 🔧 Step 2: Supabase Configuration

### 2.1 Configure Google Provider

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and toggle it on
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Save the configuration

### 2.2 Update Site URL

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set your site URL:
   - Production: `https://yourdomain.com`
   - Development: `http://localhost:3000`
3. Add redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback`

## 🔧 Step 3: Environment Variables

Add these to your `.env.local` file:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth (optional - handled by Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🔧 Step 4: Database Setup

Run the following SQL in your Supabase SQL editor to ensure proper user profile handling:

```sql
-- Ensure auth.users table has proper metadata handling
-- This is usually handled automatically by Supabase

-- Optional: Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    null,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 🔧 Step 5: Testing

### 5.1 Local Testing

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Continue with Google"
4. **You should now see "OmaHub" instead of the Supabase project ID**
5. Complete the OAuth flow
6. Verify you're redirected properly

### 5.2 Production Testing

1. Deploy your application
2. Update Google Cloud Console with production URLs
3. Update Supabase with production URLs
4. Test the complete flow

## 🚨 IMPORTANT: Publishing Your OAuth App

**For production use, you need to publish your OAuth consent screen:**

1. Go back to **OAuth consent screen** in Google Cloud Console
2. Click **Publish App**
3. This removes the "unverified app" warning
4. For apps with sensitive scopes, you may need Google verification

## 🔧 Step 6: Customization

### 6.1 Customize Sign-In Button

Edit `components/auth/GoogleSignInButton.tsx`:

```tsx
// Change button text
{
  children || (loading ? "Signing in..." : "Sign in with Google");
}

// Change button style
<GoogleSignInButton
  variant="default"
  size="lg"
  className="w-full bg-blue-600 hover:bg-blue-700"
>
  Custom Text
</GoogleSignInButton>;
```

### 6.2 Customize Redirect Behavior

Edit `lib/auth/googleAuth.ts`:

```tsx
// Change default redirect
const { redirectTo = `${window.location.origin}/dashboard` } = options;

// Add custom scopes
scopes: 'email profile https://www.googleapis.com/auth/userinfo.profile',
```

## 🔧 Troubleshooting

### Common Issues

1. **Shows Supabase project ID instead of app name**

   - Configure OAuth consent screen properly (Step 1.3)
   - Set app name to "OmaHub"
   - Publish the OAuth app

2. **"redirect_uri_mismatch" error**

   - Check that your redirect URIs in Google Cloud Console match exactly
   - Ensure no trailing slashes

3. **"Invalid client" error**

   - Verify Client ID and Secret are correct
   - Check that Google+ API is enabled

4. **User not redirected after sign-in**

   - Check middleware configuration
   - Verify auth callback page is working

5. **Session not persisting**
   - Check Supabase URL configuration
   - Verify cookie settings

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
NEXT_PUBLIC_DEBUG_AUTH=true
```

## 🔧 Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Domain Validation**: Restrict OAuth to your domains only
4. **Token Expiry**: Configure appropriate session timeouts
5. **Scopes**: Only request necessary permissions

## 🔧 Next Steps

- [ ] Set up email authentication as fallback
- [ ] Configure OAuth consent screen branding
- [ ] Publish OAuth app for production
- [ ] Add custom domain for better branding

## 📚 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
