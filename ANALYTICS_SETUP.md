# Analytics Integration Setup Guide

This guide explains how to set up real page view tracking using either Vercel Analytics or Google Analytics 4.

## Option 1: Vercel Analytics (Recommended)

Vercel Analytics is the easiest to set up if you're already hosting on Vercel.

### Setup Steps:

1. **Enable Vercel Analytics** in your Vercel dashboard:

   - Go to your project dashboard on Vercel
   - Navigate to the "Analytics" tab
   - Enable analytics for your project

2. **Get your Vercel Access Token**:

   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Create a new token with appropriate permissions
   - Copy the token

3. **Add Environment Variables**:

   ```bash
   # Required
   VERCEL_ACCESS_TOKEN=your_access_token_here

   # Optional (if you're part of a team)
   VERCEL_TEAM_ID=your_team_id_here
   VERCEL_PROJECT_ID=your_project_id_here
   ```

4. **Deploy** your application - the analytics will start working automatically!

### Vercel Analytics Features:

- ✅ Real-time page views
- ✅ No additional setup required
- ✅ Automatic integration with Vercel hosting
- ✅ Privacy-focused (no cookies)

---

## Option 2: Google Analytics 4

Google Analytics provides more detailed analytics but requires more setup.

### Setup Steps:

1. **Create a Google Analytics 4 Property**:

   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property for your website
   - Note down your Property ID (format: `123456789`)

2. **Create a Service Account**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the "Google Analytics Data API"
   - Go to "IAM & Admin" > "Service Accounts"
   - Create a new service account
   - Download the JSON key file

3. **Grant Analytics Access**:

   - In Google Analytics, go to Admin > Property > Property Access Management
   - Add the service account email (from the JSON file) as a "Viewer"

4. **Add Environment Variables**:

   ```bash
   # Required
   GOOGLE_ANALYTICS_PROPERTY_ID=123456789
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'
   ```

5. **Add Google Analytics Tracking** to your website:
   ```html
   <!-- Add to your app/layout.tsx -->
   <Script
     src={`https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID`}
     strategy="afterInteractive"
   />
   <Script id="google-analytics" strategy="afterInteractive">
     {`
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', 'GA_MEASUREMENT_ID');
     `}
   </Script>
   ```

### Google Analytics Features:

- ✅ Detailed user behavior analytics
- ✅ Custom events and conversions
- ✅ Audience insights
- ✅ Real-time and historical data

---

## How It Works

The system automatically tries to fetch real analytics data in this order:

1. **Google Analytics** (if configured)
2. **Vercel Analytics** (if configured)
3. **Estimated Views** (fallback based on engagement metrics)

### Current Status

You can check which analytics source is being used by looking at the dashboard or checking the browser console logs:

- ✅ **"Real Analytics"** = Using actual data from Google Analytics or Vercel
- ⚠️ **"Estimated"** = Using calculated estimates based on site activity

---

## Testing Your Setup

1. **Check the API endpoints**:

   - Visit `/api/analytics/pageviews` for Vercel Analytics
   - Visit `/api/analytics/google` for Google Analytics

2. **Monitor the console logs** when loading the dashboard - you'll see which analytics source is being used.

3. **Verify in the dashboard** - the "Page Views" card will show the source in small text below the number.

---

## Troubleshooting

### Vercel Analytics Issues:

- **401 Unauthorized**: Check your `VERCEL_ACCESS_TOKEN`
- **403 Forbidden**: Ensure the token has the right permissions
- **404 Not Found**: Verify your `VERCEL_PROJECT_ID` and `VERCEL_TEAM_ID`

### Google Analytics Issues:

- **Authentication Failed**: Check your service account JSON format
- **Property Not Found**: Verify your `GOOGLE_ANALYTICS_PROPERTY_ID`
- **Permission Denied**: Ensure the service account has "Viewer" access in GA4

### General Issues:

- **Still showing estimated views**: Check browser console for error messages
- **API timeouts**: Analytics APIs can be slow - this is normal
- **Zero page views**: Make sure your tracking is properly installed and has had time to collect data

---

## Environment Variables Summary

```bash
# Vercel Analytics (Option 1)
VERCEL_ACCESS_TOKEN=your_vercel_token
VERCEL_TEAM_ID=team_xxx (optional)
VERCEL_PROJECT_ID=prj_xxx (optional)

# Google Analytics (Option 2)
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# You can configure both - the system will use Google Analytics first, then fall back to Vercel
```

Choose the option that best fits your needs. Vercel Analytics is simpler if you're already on Vercel, while Google Analytics provides more comprehensive data.
