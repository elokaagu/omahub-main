# WhatsApp Integration Setup Guide

This guide explains how to set up and use the WhatsApp integration feature for OmaHub, which allows customers to contact designers directly via WhatsApp with pre-filled messages.

## Overview

The WhatsApp integration provides an Instagram-style "link in bio" experience, where customers can click a WhatsApp button to start a conversation with designers. This is particularly valuable for Nigerian vendors and smaller brands who rely heavily on WhatsApp for business communication.

## Database Setup

### Step 1: Add WhatsApp Column to Brands Table

Run the following SQL script in your Supabase SQL editor:

```sql
-- Add WhatsApp field to brands table
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add a comment to explain the field
COMMENT ON COLUMN public.brands.whatsapp IS 'WhatsApp phone number in international format (e.g., +234XXXXXXXXXX)';

-- Verify the migration
SELECT id, name, whatsapp, instagram, website FROM public.brands LIMIT 5;
```

### Step 2: Update Sample Data (Optional)

If you want to add sample WhatsApp numbers to existing brands:

```sql
-- Add sample WhatsApp numbers to demonstrate functionality
UPDATE public.brands
SET whatsapp = '+234 803 123 4567'
WHERE id = 'adire-designs';

UPDATE public.brands
SET whatsapp = '+234 901 234 5678'
WHERE id = 'lagos-bridal';

UPDATE public.brands
SET whatsapp = '+234 812 345 6789'
WHERE id = 'beads-by-nneka';
```

## Features

### 1. WhatsApp Contact Component

- **Location**: `components/ui/whatsapp-contact.tsx`
- **Purpose**: Reusable component that creates WhatsApp deep links
- **Features**:
  - Formats phone numbers for WhatsApp compatibility
  - Generates pre-filled messages mentioning OmaHub
  - Opens WhatsApp in new tab/window
  - Provides user feedback via toast notifications
  - Supports different button variants and sizes

### 2. Phone Number Validation

- Validates WhatsApp phone numbers in international format
- Requires country code (e.g., +234 for Nigeria)
- Supports 10-15 digit phone numbers
- Includes formatting utilities for display

### 3. Brand Profile Integration

- WhatsApp buttons appear in main action sections
- Dedicated contact section with all available methods
- Color-coded buttons (green for WhatsApp, pink for Instagram, blue for website)
- Responsive design for mobile and desktop

### 4. Admin Interface

- Brand owners can add/edit WhatsApp numbers via Studio
- Input validation and formatting guidance
- Character limits and user-friendly placeholders
- Available in both brand creation and edit forms

## User Experience

### For Customers:

1. **Discovery**: See WhatsApp button on brand profiles (if available)
2. **Click to Contact**: Single click opens WhatsApp with pre-filled message
3. **Instant Communication**: Direct connection to brand's WhatsApp Business

### For Brand Owners:

1. **Easy Setup**: Add WhatsApp number in Studio settings
2. **Professional Appearance**: Branded contact buttons on profile
3. **Direct Inquiries**: Receive qualified leads with context from OmaHub

### Pre-filled Message Template:

```
Hi [Brand Name]! I found your designs on OmaHub and I'm interested in learning more about your work.
```

## Implementation Details

### WhatsApp URL Format

```
https://wa.me/[PHONE_NUMBER]?text=[ENCODED_MESSAGE]
```

### Phone Number Formatting

- **Input**: `+234 803 123 4567` or `+2348031234567`
- **WhatsApp URL**: `2348031234567` (no spaces, no +)
- **Display**: `+234 803 123 4567` (formatted for readability)

### Component Usage Examples

#### Basic WhatsApp Button

```jsx
<WhatsAppContact phoneNumber="+234 803 123 4567" brandName="Adire Designs" />
```

#### Customized Button

```jsx
<WhatsAppContact
  phoneNumber="+234 803 123 4567"
  brandName="Adire Designs"
  variant="outline"
  className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
  size="sm"
>
  <MessageCircle size={16} className="mr-2" />
  Chat on WhatsApp
</WhatsAppContact>
```

## Security Considerations

### Phone Number Privacy

- WhatsApp numbers are only displayed to users when they click contact options
- No automatic dialing or messaging without user consent
- Numbers are formatted for display but not exposed in page source

### Validation

- Server-side validation of phone number format
- Client-side validation prevents invalid entries
- Error handling for malformed numbers

## Testing

### Verification Steps

1. **Database**: Confirm WhatsApp column exists in brands table
2. **Admin Interface**: Test adding/editing WhatsApp numbers in Studio
3. **Brand Profiles**: Verify WhatsApp buttons appear when numbers are present
4. **Functionality**: Test WhatsApp deep links open correctly
5. **Mobile**: Ensure WhatsApp app opens on mobile devices
6. **Desktop**: Verify WhatsApp Web opens in browser

### Test Phone Numbers

Use these formats for testing:

- Nigeria: `+234 803 123 4567`
- Kenya: `+254 712 345 678`
- Ghana: `+233 24 123 4567`
- South Africa: `+27 82 123 4567`

## Troubleshooting

### Common Issues

#### WhatsApp Button Not Appearing

- Check if `whatsapp` field has a valid phone number
- Verify phone number format includes country code
- Ensure `isValidWhatsAppNumber()` function returns true

#### WhatsApp Link Not Working

- Confirm phone number format (no spaces in URL)
- Check if WhatsApp is installed on device
- Verify URL encoding of message text

#### Admin Form Issues

- Check API routes include `whatsapp` field in updates
- Verify form validation allows international phone formats
- Ensure database column exists and is accessible

### Debug Commands

```sql
-- Check WhatsApp field in database
SELECT id, name, whatsapp FROM public.brands WHERE whatsapp IS NOT NULL;

-- Validate phone number formats
SELECT id, name, whatsapp,
       CASE
         WHEN whatsapp ~ '^\+\d{10,15}$' THEN 'Valid'
         ELSE 'Invalid'
       END as format_check
FROM public.brands
WHERE whatsapp IS NOT NULL;
```

## Future Enhancements

### Potential Improvements

1. **WhatsApp Business Integration**: Official WhatsApp Business API
2. **Message Templates**: Customizable pre-filled messages per brand
3. **Analytics**: Track WhatsApp contact conversions
4. **Scheduling**: Integration with appointment booking
5. **Multi-language**: Localized messages based on user location

### Integration Opportunities

- **CRM Systems**: Log WhatsApp interactions
- **Analytics**: Track contact method preferences
- **Marketing**: WhatsApp marketing campaigns
- **Customer Support**: Integrated support workflows

## Support

For technical support with WhatsApp integration:

1. Check this documentation first
2. Verify database setup and API routes
3. Test with known working phone numbers
4. Check browser console for JavaScript errors
5. Contact development team with specific error messages

---

**Note**: This integration creates deep links to WhatsApp and does not require WhatsApp Business API credentials. It works with any valid WhatsApp phone number and relies on the user's installed WhatsApp application or WhatsApp Web.
