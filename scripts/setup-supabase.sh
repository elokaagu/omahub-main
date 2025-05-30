#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}      OmaHub Supabase Setup Guide        ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if .env.local exists
if [ -f ".env.local" ]; then
  echo -e "${GREEN}✓ .env.local file found${NC}"
else
  echo -e "${YELLOW}! .env.local file not found${NC}"
  echo -e "Creating a template .env.local file..."
  cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
EOL
  echo -e "${GREEN}✓ Created .env.local template${NC}"
  echo -e "${YELLOW}! Please update the values in .env.local with your Supabase credentials${NC}"
fi

# Check if required packages are installed
echo -e "\n${BLUE}Checking required packages...${NC}"
if npm list @supabase/supabase-js @supabase/ssr dotenv > /dev/null 2>&1; then
  echo -e "${GREEN}✓ All required packages are installed${NC}"
else
  echo -e "${YELLOW}! Some required packages may be missing${NC}"
  echo -e "Installing required packages..."
  npm install @supabase/supabase-js @supabase/ssr dotenv
  echo -e "${GREEN}✓ Packages installed${NC}"
fi

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}      Supabase Setup Instructions         ${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}Step 1: Create a Supabase Project${NC}"
echo -e "1. Go to https://supabase.com and sign in"
echo -e "2. Click 'New Project'"
echo -e "3. Enter 'OmaHub' as the project name"
echo -e "4. Set a secure database password"
echo -e "5. Choose a region closest to your users"
echo -e "6. Click 'Create new project'"

echo -e "\n${YELLOW}Step 2: Update Environment Variables${NC}"
echo -e "1. In your Supabase dashboard, go to Project Settings > API"
echo -e "2. Copy the URL and anon key"
echo -e "3. Update the .env.local file with these values"

echo -e "\n${YELLOW}Step 3: Set Up Database Schema${NC}"
echo -e "1. In your Supabase dashboard, go to SQL Editor"
echo -e "2. Create a new query"
echo -e "3. Copy and paste the contents of scripts/schema.sql"
echo -e "4. Run the query to create tables and set up security policies"

echo -e "\n${YELLOW}Step 4: Migrate Data${NC}"
echo -e "After updating your .env.local file with the correct credentials, run:"
echo -e "${BLUE}npx ts-node scripts/migrateToSupabase.ts${NC}"

echo -e "\n${YELLOW}Step 5: Configure Authentication${NC}"
echo -e "1. In your Supabase dashboard, go to Authentication > Settings"
echo -e "2. Set Site URL to http://localhost:3000 (for development)"
echo -e "3. Enable the authentication providers you want to use"

echo -e "\n${YELLOW}Step 6: Test Your Application${NC}"
echo -e "Run your Next.js application:"
echo -e "${BLUE}npm run dev${NC}"
echo -e "Navigate to http://localhost:3000/login to test authentication"

echo -e "\n${GREEN}Setup guide complete! Follow the steps above to set up your Supabase project.${NC}"
echo -e "${BLUE}For more details, refer to SUPABASE_SETUP.md${NC}" 