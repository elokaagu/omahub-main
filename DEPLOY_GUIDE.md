# OmaHub Deployment Guide

## Vercel Build Commands

Use these commands in the Vercel dashboard under Project Settings > Build & Development Settings:

### Build Command

```
CI=false NODE_OPTIONS="--no-warnings" npx next build
```

### Development Command

```
next dev
```

### Install Command

```
npm install
```

## Environment Variables

Add these environment variables in the Vercel dashboard under Project Settings > Environment Variables:

```
VERCEL_BUILD_STEP=true
CI=false
NODE_OPTIONS=--no-warnings
```

## Manual Deployment Steps

1. Visit the Vercel dashboard: https://vercel.com/dashboard
2. Select the OmaHub project
3. Go to Settings > General
4. Set Framework Preset to: Next.js
5. Update the build command to: `CI=false NODE_OPTIONS="--no-warnings" npx next build`
6. Go to Settings > Environment Variables and add the variables listed above
7. Go to Deployments and click "Deploy" to trigger a new deployment

## CLI Deployment

To deploy from your local machine:

```bash
# Run our custom deployment script
node deploy.js

# Or deploy directly with Vercel CLI
npx vercel --prod --build-env VERCEL_BUILD_STEP=true --build-env CI=false --build-env NODE_OPTIONS="--no-warnings"
```

## Troubleshooting

If you encounter build errors:

1. Make sure the problematic API routes are simplified for build time:

   - app/api/migrate-images/route.ts
   - app/api/repair-images/route.ts

2. Try clearing the .next directory before rebuilding:

   ```bash
   rm -rf .next
   npm run build
   ```

3. Verify your vercel.json configuration:

   ```json
   {
     "version": 2,
     "buildCommand": "CI=false npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "nextjs",
     "outputDirectory": ".next",
     "regions": ["sfo1"],
     "build": {
       "env": {
         "NODE_OPTIONS": "--no-warnings",
         "VERCEL_BUILD_STEP": "true",
         "CI": "false"
       }
     },
     "env": {
       "NODE_OPTIONS": "--no-warnings",
       "VERCEL_BUILD_STEP": "true",
       "CI": "false"
     }
   }
   ```

4. For persistent issues, deploy through the Vercel dashboard interface rather than the CLI
