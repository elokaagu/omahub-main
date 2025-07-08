# Tailor Services Guide

## Overview

The OmaHub platform now includes specialized features for tailors to upload and manage their services, consultations, and custom design offerings. This guide explains how to use these new tailor-specific features.

## 🎯 Key Features

### 1. **Service Types**

- **Products**: Ready-made items with fixed pricing
- **Services**: Custom tailoring with flexible pricing
- **Consultations**: Design planning sessions

### 2. **Flexible Pricing Models**

- **Fixed Price**: Set price for complete services
- **Hourly Rate**: Per-hour pricing for ongoing work
- **Consultation Fee**: Fixed fee for design consultations
- **Contact for Pricing**: Custom pricing with optional price ranges

### 3. **Tailor-Specific Fields**

- **Specialties**: Areas of expertise (Bridal, Evening Gowns, Alterations, etc.)
- **Fitting Sessions**: Number and description of fittings included
- **Measurement Guide**: Instructions for taking measurements
- **Lead Time**: Expected completion time
- **Requirements**: What clients need to bring or prepare

## 📋 How to Use

### Creating a Service

1. **Navigate to Services**

   - Go to Studio → Services
   - Click "Add Service"

2. **Select Your Brand**

   - Choose from your tailor brands
   - Only brands with tailor categories will appear

3. **Choose Service Type**

   - **Consultation**: Design planning and advice
   - **Alterations**: Adjustments and repairs
   - **Custom Design**: Complete garment creation
   - **Fitting**: Professional fitting sessions

4. **Fill Service Details**

   - **Title**: Name of your service
   - **Description**: Detailed explanation of what's included
   - **Duration**: How long the service takes
   - **Lead Time**: Expected completion time

5. **Set Pricing**

   - Choose your pricing model
   - Set consultation fees, hourly rates, or fixed prices
   - Option to use "Contact for Pricing" for custom quotes

6. **Add Specialties**

   - Select from predefined specialties
   - Add custom specialties if needed

7. **Service Process**

   - **Requirements**: What clients need to prepare
   - **Measurement Guide**: Instructions for measurements
   - **Sessions Included**: Number of fittings or consultations
   - **Delivery Method**: Pickup, delivery, or consultation only

8. **What's Included**
   - List everything included in the service
   - Examples: "Initial consultation", "2 fittings", "Final alterations"

### Managing Services

1. **View Services**

   - Studio → Services shows all your services
   - Filter by brand, service type, or search

2. **Edit Services**

   - Click the edit icon on any service card
   - Update pricing, specialties, or process details

3. **Service Analytics**
   - View service performance
   - Track inquiries and bookings

## 🎨 Service Categories

### Bridal Services

- Wedding dress design and fitting
- Bridal party coordination
- Dress alterations and adjustments

### Custom Design

- Bespoke garment creation
- Pattern development
- Fabric consultation

### Alterations

- Hemming and adjustments
- Resizing and refitting
- Repair services

### Consultations

- Design planning sessions
- Wardrobe consultation
- Styling advice

## 💰 Pricing Strategies

### Fixed Price Services

- Best for: Standard alterations, consultations
- Example: "Basic hemming - $25"

### Hourly Rate Services

- Best for: Complex alterations, design work
- Example: "Custom design - $75/hour"

### Consultation Fees

- Best for: Design planning, wardrobe advice
- Example: "Bridal consultation - $150"

### Contact for Pricing

- Best for: Complex custom work, bespoke designs
- Include price range for guidance

## 🔧 Technical Details

### Database Structure

Services are stored as products with additional metadata:

- `service_type`: "product", "service", or "consultation"
- `consultation_fee`: Fixed consultation price
- `hourly_rate`: Per-hour pricing
- `specialties`: Array of expertise areas
- `fitting_sessions`: Description of fitting process
- `measurement_guide`: Measurement instructions
- `contact_for_pricing`: Boolean for custom pricing

### Integration with Existing Features

- Services appear in product searches when relevant
- Booking system works with service pricing
- Customer inquiries route to brand inbox
- Reviews and ratings apply to services

## 📱 Customer Experience

### Service Discovery

- Services appear in tailor brand profiles
- Searchable by specialty and service type
- Clear pricing and process information

### Booking Process

- Contact tailor directly for consultations
- Clear requirements and preparation steps
- Transparent pricing and timeline

### Service Delivery

- Structured fitting process
- Clear communication channels
- Professional service tracking

## 🚀 Best Practices

### Service Descriptions

- Be specific about what's included
- Clearly state requirements
- Mention your specialties and experience

### Pricing Strategy

- Research local market rates
- Consider your expertise level
- Offer consultation packages

### Customer Communication

- Respond promptly to inquiries
- Set clear expectations
- Document the process

### Portfolio Building

- Upload high-quality service images
- Showcase your best work
- Highlight unique specialties

## 🔄 Migration from Products

### Existing Tailors

If you previously listed services as products:

1. Create new services using the service upload form
2. Include all relevant tailor-specific details
3. Update pricing to reflect service nature
4. Archive old product listings if needed

### Data Preservation

- All existing product data remains intact
- New service fields are optional additions
- Backward compatibility maintained

## 📞 Support

### Getting Help

- Check the FAQ section for common questions
- Contact support for technical issues
- Join the tailor community for tips and advice

### Feature Requests

- Submit suggestions for new service features
- Report bugs or issues
- Participate in beta testing for new tools

---

_This guide covers the core tailor services functionality. For additional features and updates, check the latest documentation or contact support._
