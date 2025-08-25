# Google Analytics 4 API Integration Setup

This guide will help you set up real Google Analytics data fetching for your OmaHub dashboard.

## 🎯 **Current Status**

- ✅ **Google Analytics Dashboard** - Created and working
- ✅ **Mock Data** - Currently showing sample data
- ✅ **API Service** - Ready for real data integration
- ❌ **Real API Connection** - Service account setup required

## 🚀 **Step 1: Google Cloud Console Setup**

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the **Google Analytics Data API**

### 1.2 Create Service Account
1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `omahub-analytics`
4. Description: `Service account for OmaHub Google Analytics integration`
5. Click **Create and Continue**

### 1.3 Grant Permissions
1. Role: **Viewer** (for Google Analytics)
2. Click **Continue**
3. Click **Done**

### 1.4 Create and Download Key
1. Click on your service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create New Key**
4. Choose **JSON** format
5. Download the key file

## 🔑 **Step 2: Environment Variables**

Add these to your `.env.local` file:

```bash
# Google Analytics API
GOOGLE_ANALYTICS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_ANALYTICS_CLIENT_EMAIL="omahub-analytics@your-project.iam.gserviceaccount.com"
GOOGLE_ANALYTICS_PROJECT_ID="your-project-id"
GOOGLE_ANALYTICS_PROPERTY_ID="your-ga4-property-id"
```

## 📊 **Step 3: Update Analytics Configuration**

Update `lib/config/analytics.ts`:

```typescript
// Add these new environment variables
export const GA_PRIVATE_KEY = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;
export const GA_CLIENT_EMAIL = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
export const GA_PROJECT_ID = process.env.GOOGLE_ANALYTICS_PROJECT_ID;
export const GA_PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

// Check if API is fully configured
export const GA_API_ENABLED = !!(
  GA_PRIVATE_KEY && 
  GA_CLIENT_EMAIL && 
  GA_PROJECT_ID && 
  GA_PROPERTY_ID
);
```

## 🔧 **Step 4: Install Google Auth Library**

```bash
npm install google-auth-library
```

## 📡 **Step 5: Update Google Analytics Service**

Replace the mock data in `lib/services/googleAnalyticsService.ts` with real API calls:

```typescript
import { GoogleAuth } from 'google-auth-library';
import { analyticsdata_v1beta, analyticsdata } from 'googleapis';

// Initialize Google Auth
const auth = new GoogleAuth({
  keyFile: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});

// Initialize Analytics Data API
const analyticsData = analyticsdata({
  version: 'v1beta',
  auth,
});

export async function fetchRealGoogleAnalyticsData(): Promise<GoogleAnalyticsData> {
  try {
    const authClient = await auth.getClient();
    
    // Fetch page views
    const pageViewsResponse = await analyticsData.properties.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'screenPageViews' }],
      },
    });

    // Fetch unique users
    const usersResponse = await analyticsData.properties.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }],
      },
    });

    // Fetch top pages
    const pagesResponse = await analyticsData.properties.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      },
    });

    // Process and return real data
    return {
      pageViews: parseInt(pageViewsResponse.data.rows?.[0]?.metricValues?.[0]?.value || '0'),
      uniqueVisitors: parseInt(usersResponse.data.rows?.[0]?.metricValues?.[0]?.value || '0'),
      bounceRate: 0, // Calculate from sessions data
      avgSessionDuration: 0, // Calculate from session data
      topPages: pagesResponse.data.rows?.map(row => ({
        page: row.dimensionValues?.[0]?.value || '',
        views: parseInt(row.metricValues?.[0]?.value || '0'),
      })) || [],
      topSources: [], // Fetch from traffic source data
      deviceBreakdown: [], // Fetch from device data
      recentActivity: [], // Real-time API for live data
    };
  } catch (error) {
    console.error('Error fetching real GA data:', error);
    throw error;
  }
}
```

## 🧪 **Step 6: Test the Integration**

1. **Build the project**: `npm run build`
2. **Check the dashboard** - Should show real data if configured
3. **Check console logs** - For any API errors
4. **Verify environment variables** - All required keys present

## 🔍 **Step 7: Troubleshooting**

### Common Issues:

1. **"Service account setup required"**
   - Check environment variables
   - Verify service account permissions
   - Ensure API is enabled

2. **"Authentication failed"**
   - Check private key format
   - Verify client email
   - Check project ID

3. **"Property not found"**
   - Verify GA4 property ID
   - Check service account access
   - Ensure property exists

## 📈 **Step 8: Advanced Features**

Once basic integration works, add:

- **Real-time data** - Live user activity
- **Custom dimensions** - Brand-specific metrics
- **E-commerce tracking** - Sales and conversion data
- **Audience insights** - User demographics and behavior

## 🎉 **Success Indicators**

- ✅ Dashboard shows real page view numbers
- ✅ Data updates when refreshing
- ✅ No more "Demo mode" warnings
- ✅ Real-time user activity visible
- ✅ Traffic sources show actual data

## 🔒 **Security Notes**

- **Never commit** service account keys to Git
- **Use environment variables** for all sensitive data
- **Restrict service account** to minimum required permissions
- **Monitor API usage** to avoid quota limits

## 📞 **Need Help?**

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Test API access in Google Cloud Console
4. Check service account permissions
5. Verify GA4 property exists and is accessible

---

**Next**: Once this setup is complete, your dashboard will show real Google Analytics data instead of mock data! 🎯
