# OmaHub - African Fashion Marketplace

OmaHub is a marketplace connecting African fashion designers with customers worldwide.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/elokaagu/omahub-main.git
cd omahub-main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Then edit .env.local with your Supabase credentials
```

### Running the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

### Deployment to Vercel

The application is configured to deploy to Vercel. There are multiple ways to deploy:

#### Option 1: GitHub Integration (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure the following environment variables in Vercel:
   - `VERCEL_BUILD_STEP`: true
   - `CI`: false
   - `NODE_OPTIONS`: --no-warnings --max-old-space-size=4096
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

#### Option 2: Manual Deployment

```bash
# Clean the cache first
npm run clear-cache

# Build the application
npm run build

# Deploy using Vercel CLI
npx vercel --prod
```

### Troubleshooting Deployment

If you encounter issues during deployment:

1. Check that all environment variables are set correctly
2. Try clearing the cache with `npm run clear-cache`
3. Make sure the Supabase connection is working properly
4. Check Vercel logs for specific error messages

## Features

- Browse African fashion designers by category
- View designer profiles and collections
- Contact designers for custom orders
- Authentication and user profiles
- Designer studio for managing products and collections

## Tech Stack

- Next.js 14
- React
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- Radix UI Components
- Vercel Deployment
