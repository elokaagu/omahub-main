# 🎯 Google Tag Manager Setup for OmaHub

## 📋 **Prerequisites:**

1. **Google Tag Manager (GTM) account**
2. **OmaHub container** in GTM
3. **Administrator access** to GTM

## 🎯 **Your Current Setup Status**

✅ **GTM Container ID**: `GTM-55JQB28Z` - **Already configured!**  
✅ **GA4 Measurement ID**: `G-94EE1362LB` - **Already configured!**  
✅ **OmaHub integration**: **Complete and ready!**

Since you already have both GTM and GA4 set up, you can skip to **Step 4** to configure GA4 in GTM.

---

## 🚀 **Step 1: Create Google Tag Manager Container**

### **1.1 Go to Google Tag Manager**

- Visit [tagmanager.google.com](https://tagmanager.google.com)
- Sign in with your Google account
- **Note**: You already have container `GTM-55JQB28Z` set up! ✅

### **1.2 Create New Container**

- Click **"Create Account"** (if you don't have one)
- Enter **Account name**: `OmaHub`
- Enter **Container name**: `OmaHub Website`
- Select **Target platform**: `Web`
- Click **"Create"**
- **Note**: You already have container `GTM-55JQB28Z` set up! ✅

### **1.3 Accept Terms of Service**

- Review and accept the terms
- Click **"Yes"**

### **1.4 Copy Container ID**

- Copy your **Container ID**
- Format: `GTM-55JQB28Z` ✅ **Already configured!**
- This is your `NEXT_PUBLIC_GTM_ID`

## 🔑 **Step 2: Get Container ID**

### **2.1 Copy Container ID**

- From your GTM container, copy the **Container ID**
- Format: `GTM-55JQB28Z` ✅ **Already configured!**
- This is your `NEXT_PUBLIC_GTM_ID`
- **Your container**: `GTM-55JQB28Z` - Ready to use! 🎯

### **2.2 Container Setup**

- Your container is now ready
- GTM will automatically handle Google Analytics 4
- **Your setup**: Container `GTM-55JQB28Z` is already configured and ready! ✅

## ⚙️ **Step 3: Environment Variables**

### **3.1 Add to .env.local**

```bash
# Google Tag Manager Configuration
NEXT_PUBLIC_GTM_ID=GTM-55JQB28Z

# Google Analytics 4 Measurement ID (optional - GTM handles this)
NEXT_PUBLIC_GA_ID=G-94EE1362LB
```

**Note**: These IDs are already configured in OmaHub! ✅

### **3.2 Add to Production Environment**

- Add these variables to your production environment
- Vercel, Netlify, or your hosting platform

## 🎯 **Step 4: Configure Google Analytics 4 in GTM**

### **4.1 Create GA4 Configuration Tag**

- In GTM, go to **Tags** → **New**
- Click **"Tag Configuration"**
- Select **"Google Analytics: GA4 Configuration"**
- Enter your **Measurement ID**: `G-94EE1362LB` ✅ **Already configured!**
- Click **"Save"**

### **4.2 Set Up Triggers**

- Click **"Triggering"**
- Select **"All Pages"**
- Click **"Save"**

### **4.3 Enable Enhanced E-commerce**

- In your GA4 property, go to **Admin** → **Data Streams**
- Select your web stream
- Click **"Enhanced measurement"**
- Enable **"E-commerce"**
- **Your setup**: GA4 property `G-94EE1362LB` is already configured! ✅

## 📊 **Step 5: Test Tracking**

### **5.1 Preview Mode**

- In GTM, click **"Preview"**
- Enter your website URL: `https://yourdomain.com` (replace with your actual domain)
- Click **"Start"**
- Visit your OmaHub website
- Check if tags are firing
- **Your setup**: GTM container `GTM-55JQB28Z` is ready for testing! ✅

### **5.2 Real-time Reports**

- In GA4, go to **Reports** → **Realtime**
- Visit your OmaHub website
- Check if pageviews are tracking
- **Your setup**: GA4 property `G-94EE1362LB` is ready for real-time tracking! ✅

### **5.3 Test E-commerce Events**

- Add items to basket
- Check if `add_to_cart` events appear
- Submit custom orders
- Verify all events are firing
- **Your setup**: OmaHub is already configured to send e-commerce events to GTM! ✅

## 🔍 **Step 6: Custom Dimensions & Metrics**

### **6.1 Create Custom Dimensions**

- **Admin** → **Custom Definitions** → **Custom Dimensions**
- Create these dimensions:
  - `user_role` (User role: super_admin, brand_admin, user)
  - `brand_name` (Brand name for tracking)
  - `product_category` (Product category)

### **6.2 Create Custom Metrics**

- **Admin** → **Custom Definitions** → **Custom Metrics**
- Create these metrics:
  - `order_value` (Order total value)
  - `products_count` (Number of products)

## 📈 **Step 7: Set Up Goals**

### **7.1 Conversion Goals**

- **Admin** → **Goals**
- Create these goals:
  - **User Registration**: `sign_up` event
  - **Brand Creation**: `create_brand` event
  - **Product Creation**: `create_product` event
  - **Custom Order**: `submit_custom_order` event

### **7.2 E-commerce Goals**

- **Sales**: `purchase` event
- **Add to Cart**: `add_to_cart` event
- **Checkout Start**: `begin_checkout` event

## 🎨 **Step 8: Custom Reports**

### **8.1 User Engagement Report**

- **Reports** → **Engagement** → **Events**
- Filter by custom events
- Analyze user behavior patterns

### **8.2 E-commerce Performance**

- **Reports** → **Monetization** → **E-commerce purchases**
- Track revenue and conversion rates
- Analyze product performance

## 🚀 **Step 9: Advanced Features**

### **9.1 Audience Segmentation**

- Create segments for:
  - **Brand Admins** vs **Regular Users**
  - **High-Value Customers**
  - **Active vs Inactive Users**

### **9.2 Funnel Analysis**

- **Reports** → **Engagement** → **Funnel exploration**
- Track user journey from:
  - Landing → Registration → Brand Creation → Product Creation

### **9.3 Cohort Analysis**

- **Reports** → **Engagement** → **Cohort exploration**
- Analyze user retention over time

## 🔧 **Step 10: Troubleshooting**

### **10.1 Common Issues**

- **No data appearing**: Check if GTM script is loading
- **Events not firing**: Verify event names and parameters
- **E-commerce not working**: Check enhanced measurement settings

### **10.2 Debug Tools**

- **GTM Preview Mode**
- **GA4 DebugView**
- **Browser Developer Tools**

## 📱 **Step 11: Mobile Tracking**

### **11.1 Mobile App (if applicable)**

- Create separate container for mobile
- Configure mobile-specific events
- Track cross-platform user behavior

### **11.2 Responsive Design Tracking**

- Ensure tracking works on all screen sizes
- Test mobile-specific user flows

## 🎯 **Expected Results:**

After setup, you should see:

✅ **Real-time pageviews** in GA4  
✅ **E-commerce events** firing correctly  
✅ **User engagement** tracking working  
✅ **Custom events** appearing in reports  
✅ **Conversion goals** being tracked  
✅ **Audience insights** and demographics

## 🚀 **Next Steps:**

1. **Monitor data** for 24-48 hours
2. **Set up automated reports** in GA4
3. **Create custom dashboards** for key metrics
4. **Set up alerts** for important events
5. **Integrate with other tools** (Google Ads, Search Console)

## 🔥 **GTM Advantages Over Direct GA4:**

✅ **Centralized tag management**  
✅ **Easy A/B testing setup**  
✅ **Multiple tracking tools**  
✅ **Version control**  
✅ **User permissions**  
✅ **Debugging tools**  
✅ **Template library**

## 🎯 **Your Current Status Summary**

### **✅ What's Already Configured:**

- **GTM Container**: `GTM-55JQB28Z` - Ready and active
- **GA4 Property**: `G-94EE1362LB` - Ready and active
- **OmaHub Integration**: Complete with all tracking events
- **E-commerce Tracking**: Configured for basket, orders, and engagement

### **🚀 What You Can Do Now:**

1. **Test your setup** using GTM Preview mode
2. **View real-time data** in GA4
3. **Monitor user behavior** on your OmaHub platform
4. **Track conversions** and e-commerce events
5. **Analyze user engagement** and performance

### **📊 Expected Results:**

After testing, you should see:

- ✅ **Real-time pageviews** in GA4
- ✅ **E-commerce events** firing correctly
- ✅ **User engagement** tracking working
- ✅ **Custom events** appearing in reports
- ✅ **Conversion goals** being tracked

---

**Need Help?** Check the [Google Tag Manager Help Center](https://support.google.com/tagmanager) or refer to the OmaHub documentation.
