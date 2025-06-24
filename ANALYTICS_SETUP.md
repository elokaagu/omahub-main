# Analytics Integration Setup Guide

This guide explains how to set up real page view tracking using Vercel Analytics (recommended) or Google Analytics 4.

## 🚀 Quick Setup: Vercel Analytics (Recommended)

Vercel Analytics is the easiest to set up if you're already hosting on Vercel.

### Step 1: Enable Analytics in Vercel Dashboard

1. Go to your project dashboard on [Vercel](https://vercel.com)
2. Navigate to the "Analytics" tab
3. Enable analytics for your project

### Step 2: Get Access Token (Optional - for API access)

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token with appropriate permissions
3. Copy the token

### Step 3: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Vercel Analytics (Optional - for detailed API access)
VERCEL_ACCESS_TOKEN=your_vercel_access_token_here
VERCEL_TEAM_ID=your_team_id_here
VERCEL_PROJECT_ID=your_project_id_here
```

**Note:** The basic analytics tracking works automatically without these environment variables. They're only needed if you want to fetch detailed analytics data via API.

### Step 4: Deploy

Deploy your application - analytics will start working automatically!

---

## ✅ What You Get

- ✅ **Real-time page views** in your dashboard
- ✅ **Privacy-focused** (no cookies)
- ✅ **Automatic integration** with Vercel hosting
- ✅ **Zero configuration** for basic tracking

---

## 🔧 Advanced: Google Analytics 4 (Optional)

Only set this up if you need more detailed analytics than Vercel provides.

### Setup Steps:

1. **Create GA4 Property** at [Google Analytics](https://analytics.google.com/)
2. **Create Service Account** at [Google Cloud Console](https://console.cloud.google.com/)
3. **Enable Analytics Data API**
4. **Grant Analytics Access** to service account
5. **Add Environment Variables**:

```bash
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

---

## 🔍 How It Works

The system automatically tries to fetch real analytics data in this order:

1. **Vercel Analytics** (if configured)
2. **Estimated Views** (fallback based on engagement metrics)

### Current Status Check

You can check which analytics source is being used by looking at the dashboard or browser console logs:

- ✅ **"Vercel Analytics"** = Using real data from Vercel
- ⚠️ **"Estimated"** = Using calculated estimates

---

## 🐛 Troubleshooting

### No Real Analytics Data?

1. **Check Vercel Dashboard**: Ensure analytics is enabled for your project
2. **Wait for Data**: Analytics may take 24-48 hours to start showing data
3. **Check Environment Variables**: Ensure `VERCEL_ACCESS_TOKEN` is correct (if using API)
4. **Browser Console**: Look for error messages in the console

### Still Showing "Estimated"?

This is normal for new projects. The system will automatically switch to real data once:

- Analytics is enabled in Vercel
- Your site has received some traffic
- The API credentials are properly configured (if using API access)

---

## 📊 Environment Variables Summary

```bash
# Basic Setup (Analytics tracking works automatically)
# No environment variables needed!

# Advanced Setup (For API access to detailed analytics)
VERCEL_ACCESS_TOKEN=your_vercel_token
VERCEL_TEAM_ID=team_xxx (optional)
VERCEL_PROJECT_ID=prj_xxx (optional)

# Google Analytics (Alternative)
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

**For most users, no environment variables are needed!** Just enable analytics in your Vercel dashboard and deploy.
