# 🚀 Quick Fix: Change Google Sign-In from Supabase URL to "OmaHub"

**Problem**: Google sign-in shows `gswduyodzdgucjscjtvz.supabase.co` instead of "OmaHub"

**Solution**: 5-minute fix in Google Cloud Console

## 📋 Step-by-Step Fix

### Step 1: Open Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project (the one with your OAuth credentials)

### Step 2: Navigate to OAuth Consent Screen

1. In the left sidebar, click **"APIs & Services"**
2. Click **"OAuth consent screen"**

### Step 3: Edit App Information

1. Click **"EDIT APP"** button
2. In the **"App name"** field, change it to: `OmaHub`
3. Make sure **"User support email"** is filled in
4. Scroll down and click **"SAVE AND CONTINUE"**

### Step 4: Skip Through Other Sections

1. **Scopes page**: Click **"SAVE AND CONTINUE"** (don't change anything)
2. **Test users page**: Click **"SAVE AND CONTINUE"** (don't change anything)
3. **Summary page**: Click **"BACK TO DASHBOARD"**

### Step 5: Test the Fix

1. Go back to your app: http://localhost:3000/login
2. Click **"Continue with Google"**
3. You should now see **"Choose an account to continue to OmaHub"** ✅

## 🎯 That's it!

The change takes effect immediately. No need to restart your app or change any code.

## 📸 Visual Guide

**What you're looking for:**

```
Before: "Choose an account to continue to gswduyodzdgucjscjtvz.supabase.co"
After:  "Choose an account to continue to OmaHub"
```

## 🔧 If You Can't Find Your Project

1. In Google Cloud Console, click the project dropdown at the top
2. Look for a project that might be related to your OAuth setup
3. Or create a new project and set up OAuth from scratch

## 🆘 Need Help?

If you get stuck on any step, let me know exactly what you see on your screen and I'll help you navigate it!

## 🚨 Common Gotchas

- **Can't find OAuth consent screen?** Make sure you're in the right Google Cloud project
- **App name field is grayed out?** You might need to verify your email first
- **Still showing Supabase URL?** Clear your browser cache and try again

## ⚡ Pro Tip

Once this is working, you can also:

- Upload your OmaHub logo for the consent screen
- Add your website domain for a more professional look
- Publish the app to remove the "unverified app" warning
