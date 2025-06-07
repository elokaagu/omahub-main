# 🔐 Google OAuth Setup Guide

## 🎯 Current Status

✅ **OAuth Button Component**: Created and integrated  
✅ **Test Page**: Available at `/test-oauth`  
✅ **Login/Signup Integration**: OAuth buttons added  
⚠️ **Google Cloud Console**: Needs configuration  
⚠️ **Supabase Dashboard**: Needs Google provider setup  
⚠️ **Environment Variables**: Need Google credentials

## 📋 Step-by-Step Setup

### **Step 1: Google Cloud Console Setup**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select Project**: Choose your project or create a new one
3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"

### **Step 2: Configure OAuth Client**

**Application Type**: Web application  
**Name**: OmaHub (or your preferred name)

**Authorized JavaScript origins**:

```
http://localhost:3000
https://omahub-main.vercel.app
```

**Authorized redirect URIs** (CRITICAL):

```
http://localhost:3000/auth/callback
https://gswduyodzdgucjscjtvz.supabase.co/auth/v1/callback
https://omahub-main.vercel.app/auth/callback
```

### **Step 3: Get Your Credentials**

After creating the OAuth client, you'll get:

- **Client ID**: `815616743762-xxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxx`

### **Step 4: Configure Supabase Dashboard**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to Authentication** → **Providers**
3. **Enable Google Provider**:
   - Toggle "Enable sign in with Google"
   - **Client ID**: Paste your Google Client ID
   - **Client Secret**: Paste your Google Client Secret
   - **Redirect URL**: Should show `https://gswduyodzdgucjscjtvz.supabase.co/auth/v1/callback`

### **Step 5: Update Environment Variables**

Add to your `.env.local` file:

```env
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=815616743762-xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx
```

### **Step 6: Test the Implementation**

1. **Start Development Server**: `npm run dev`
2. **Visit Test Page**: http://localhost:3000/test-oauth
3. **Run Tests**:
   - Click "Test Supabase Connection" → Should show ✅
   - Click "Test OAuth Config" → Should show ✅ or specific error
4. **Test OAuth Button**: Click "Continue with Google"

## 🧪 Testing Checklist

### **Environment Check** (at `/test-oauth`):

- ✅ Supabase URL: Set
- ✅ Supabase Key: Set
- ⚠️ Google Client ID: Not Set (until you add it)
- ✅ Environment: development
- ✅ Current URL: http://localhost:3000

### **Expected Test Results**:

**Before Google Setup**:

- Supabase Connection: ✅ Success
- OAuth Config: ⚠️ "Provider not found" or "Google OAuth provider not configured"

**After Google Setup**:

- Supabase Connection: ✅ Success
- OAuth Config: ✅ Success
- OAuth Button: Should redirect to Google login

## 🔧 Troubleshooting

### **Common Issues**:

1. **"Provider not found"**

   - Google provider not enabled in Supabase Dashboard
   - Solution: Enable Google in Supabase Auth settings

2. **"Invalid client"**

   - Wrong Client ID or Client Secret
   - Solution: Double-check credentials in Supabase Dashboard

3. **"Redirect URI mismatch"**

   - Missing redirect URI in Google Cloud Console
   - Solution: Add all required redirect URIs (see Step 2)

4. **"Access blocked"**
   - OAuth consent screen not configured
   - Solution: Configure OAuth consent screen in Google Cloud Console

## 🎯 Success Indicators

You'll know it's working when:

1. **Test Page Shows**: All green checkmarks
2. **OAuth Button**: Redirects to Google login page
3. **After Google Login**: Redirects back to your app
4. **User Session**: Created successfully in Supabase

## 📱 Next Steps After Setup

Once OAuth is working:

1. **Test on Different Browsers**: Ensure cross-browser compatibility
2. **Test Signup vs Login**: Both should work with Google
3. **Test User Profile Creation**: Verify profiles are created for OAuth users
4. **Production Testing**: Test on your Vercel deployment

## 🚀 Current Implementation Features

- ✅ **Clean OAuth Button**: Modern design with loading states
- ✅ **Proper Error Handling**: User-friendly error messages
- ✅ **Debug Logging**: Comprehensive console logging
- ✅ **Test Environment**: Dedicated test page for debugging
- ✅ **Responsive Design**: Works on mobile and desktop
- ✅ **Integration Ready**: Added to login and signup pages

## 📞 Need Help?

If you encounter issues:

1. **Check the test page**: `/test-oauth` for specific error messages
2. **Check browser console**: Look for detailed error logs
3. **Verify all URLs**: Ensure redirect URIs match exactly
4. **Test step by step**: Use the test buttons to isolate issues

Your OAuth implementation is now ready for configuration! 🎉
