# Pipeline Value Configuration

This document explains how to configure the pipeline value calculation in the leads management system.

## Overview

The pipeline value represents the estimated total value of all leads in your system. You can choose between two calculation methods or disable it entirely.

## Configuration Options

### 1. Show/Hide Pipeline Value

To completely remove the pipeline value from the leads dashboard:

```typescript
// In lib/config/leads.ts
export const LEADS_CONFIG = {
  SHOW_PIPELINE_VALUE: false, // Set to false to hide completely
  // ... other settings
};
```

### 2. Calculation Methods

#### Simple Calculation (Default Previous Behavior)

Uses the `estimated_value` field from each lead:

```typescript
export const LEADS_CONFIG = {
  USE_INTELLIGENT_CALCULATION: false,
  // ... other settings
};
```

#### Intelligent Calculation (Recommended)

Calculates pipeline value based on actual brand product averages:

```typescript
export const LEADS_CONFIG = {
  USE_INTELLIGENT_CALCULATION: true,
  // ... other settings
};
```

## How Intelligent Calculation Works

When `USE_INTELLIGENT_CALCULATION` is enabled:

1. **For leads with existing `estimated_value`**: Uses the existing value
2. **For leads without `estimated_value`**:
   - Fetches the brand's average product price
   - Applies a status-based multiplier
   - Falls back to configured default values if brand data unavailable

### Status Multipliers

Different lead statuses have different likelihood of conversion:

```typescript
STATUS_MULTIPLIERS: {
  new: 0.3,        // 30% of average price for new leads
  contacted: 0.5,   // 50% for contacted leads
  qualified: 0.8,   // 80% for qualified leads
  converted: 1.2,   // 120% for converted leads (they might buy multiple items)
  lost: 0.0,        // 0% for lost leads
  closed: 1.0,      // 100% for closed leads
}
```

### Fallback Values

When brand pricing data is unavailable:

```typescript
FALLBACK_VALUES: {
  new: 200,
  contacted: 300,
  qualified: 400,
  converted: 500,
  lost: 0,
  closed: 450,
}
```

## Benefits of Intelligent Calculation

1. **More Accurate Estimates**: Based on actual product pricing
2. **Automatic Updates**: Pipeline value adjusts as product prices change
3. **Status-Aware**: Accounts for likelihood of conversion by lead status
4. **Fallback Protection**: Still works when brand data is unavailable

## Configuration Examples

### Hide Pipeline Value Completely

```typescript
export const LEADS_CONFIG = {
  SHOW_PIPELINE_VALUE: false,
  // Other settings don't matter when hidden
};
```

### Use Simple Calculation (Original Behavior)

```typescript
export const LEADS_CONFIG = {
  SHOW_PIPELINE_VALUE: true,
  USE_INTELLIGENT_CALCULATION: false,
};
```

### Use Intelligent Calculation (Recommended)

```typescript
export const LEADS_CONFIG = {
  SHOW_PIPELINE_VALUE: true,
  USE_INTELLIGENT_CALCULATION: true,
  // Customize multipliers and fallbacks as needed
};
```

## API Integration

The system uses the `/api/brands/[id]/products` endpoint to fetch pricing data. This endpoint returns:

```typescript
{
  pricing_stats: {
    price_range: {
      average: number,
      min: number,
      max: number
    },
    // ... other pricing statistics
  }
}
```

## Performance Considerations

- Brand pricing data is cached during calculation to avoid duplicate API calls
- Calculation is performed asynchronously to avoid blocking the UI
- Falls back to simple calculation if intelligent calculation fails
