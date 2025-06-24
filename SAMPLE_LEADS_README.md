# Sample Leads Data for Dashboard

This document describes the sample leads data that has been created to demonstrate the LeadsTrackingDashboard functionality.

## Overview

We've created **10 diverse sample leads** across different brands, sources, and statuses to showcase the full capabilities of the leads tracking system.

## Sample Data Breakdown

### Leads by Status

- **New**: 2 leads (fresh inquiries)
- **Contacted**: 2 leads (initial contact made)
- **Qualified**: 2 leads (potential customers identified)
- **Converted**: 2 leads (successful sales)
- **Lost**: 1 lead (customer went elsewhere)
- **Closed**: 1 lead (completed transaction)

### Leads by Source

- **Instagram**: 2 leads
- **Website**: 2 leads
- **Referral**: 2 leads
- **WhatsApp**: 1 lead
- **Email**: 1 lead
- **Phone**: 1 lead
- **Direct**: 1 lead

### Sample Brands Used

1. **Adunni Couture** - Fashion (Premium Nigerian fashion house)
2. **Kemi Beauty Studio** - Beauty (Professional makeup services)
3. **Tolu Photography** - Photography (Wedding and event photography)
4. **Eko Catering Co** - Catering (Authentic Nigerian cuisine)

## Sample Leads Details

### Recent Leads (This Month)

1. **Funmi Adebayo** - Custom wedding dress inquiry (Instagram, New, High Priority)
2. **Chioma Okafor** - Bridal makeup booking (Website, Contacted, Urgent)
3. **David Johnson** - Photography consultation (Referral, Qualified, High Priority)
4. **Amina Hassan** - Wedding catering (WhatsApp, Converted, Normal)
5. **Grace Emeka** - Corporate outfit inquiry (Email, Contacted, Normal)

### Older Leads (Previous Months)

6. **Blessing Okoro** - Birthday photoshoot (Phone, Converted, High Priority)
7. **Michael Ade** - Engagement shoot (Direct, Lost, Low Priority)
8. **Fatima Bello** - Corporate catering (Instagram, Qualified, Normal)
9. **Kemi Afolabi** - Casual wear inquiry (Referral, Closed, Low Priority)
10. **Ola Adeyemi** - Makeup consultation (Website, New, Normal)

## Dashboard Features Demonstrated

### Analytics Cards

- **Total Leads**: Shows count of all leads
- **Conversion Rate**: Percentage of leads that converted to sales
- **Total Revenue**: Sum of all booking values
- **Commission Earned**: Total commission from converted leads

### Charts

- **Leads by Source**: Pie chart showing distribution across different channels
- **Monthly Trends**: Bar chart showing leads and bookings over time

### Leads Table

- **Filtering**: By status, source, and search
- **Status Management**: Dropdown to update lead status
- **Priority Indicators**: Visual badges for priority levels
- **Brand Information**: Logo and name display
- **Contact Details**: Customer name, email, phone
- **Value Tracking**: Estimated and actual booking values
- **Timeline**: Created, contacted, qualified, converted dates

## Accessing the Dashboard

1. Visit `/studio` in your application
2. Ensure you're logged in as a super_admin user
3. Scroll down to the "Leads Tracking Dashboard" section
4. Explore the analytics, charts, and leads table

## Data Management

### To View Current Sample Data

```sql
SELECT * FROM leads
WHERE customer_email LIKE '%@example.com'
   OR customer_email LIKE '%@sample.com';
```

### To Remove Sample Data

```sql
-- Remove sample bookings first (if any were created)
DELETE FROM bookings
WHERE customer_email LIKE '%@example.com'
   OR customer_email LIKE '%@sample.com';

-- Remove sample leads
DELETE FROM leads
WHERE customer_email LIKE '%@example.com'
   OR customer_email LIKE '%@sample.com';
```

### To Recreate Sample Data

```bash
node scripts/create-sample-leads-direct.js
```

## Real-World Usage

Once you're satisfied with testing the dashboard with sample data, you can:

1. Remove the sample data using the SQL commands above
2. Start adding real leads through:
   - The dashboard interface
   - API endpoints
   - Direct database insertion
   - Integration with your lead capture forms

## Notes

- Sample leads use `@example.com` and `@sample.com` email domains for easy identification
- All sample data includes realistic Nigerian names, phone numbers, and business scenarios
- Estimated values are in Naira (NGN) and reflect typical service pricing
- Lead progression follows realistic timelines (created → contacted → qualified → converted)
- Some leads intentionally show different outcomes (lost, closed) for comprehensive testing

## Troubleshooting

If you don't see the sample leads in your dashboard:

1. Check that you're logged in as a super_admin user
2. Verify the leads were created: `SELECT COUNT(*) FROM leads;`
3. Check browser console for any authentication errors
4. Use the SessionFixer component in development mode
5. Ensure the analytics function is working: Test the `/api/admin/leads?action=analytics` endpoint

## Next Steps

With sample data in place, you can now:

- Test all dashboard features
- Verify analytics calculations
- Practice lead management workflows
- Customize the dashboard appearance
- Add new features or filters
- Integrate with real data sources
