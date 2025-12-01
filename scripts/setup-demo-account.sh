#!/bin/bash

# CodeGuru Demo Account Setup Script
# Usage: bash scripts/setup-demo-account.sh
# 
# This script creates a demo admin account in Supabase
# Demo credentials:
#   Email: demo@codeguru.ai
#   Password: Demo@12345

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Demo credentials
DEMO_EMAIL="demo@codeguru.ai"
DEMO_PASSWORD="Demo@12345"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${RED}❌ Error: .env.local not found${NC}"
  echo "Please create .env.local with your Supabase credentials"
  exit 1
fi

# Load environment variables from .env.local
if [ -f .env.local ]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    export "$key"="$value"
  done < .env.local
fi

# Validate required variables
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo -e "${RED}❌ Error: VITE_SUPABASE_URL not set in .env.local${NC}"
  exit 1
fi

if [ -z "$VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY not set in .env.local${NC}"
  echo ""
  echo -e "${YELLOW}How to get your Service Role Key:${NC}"
  echo "1. Go to https://app.supabase.com"
  echo "2. Select your project"
  echo "3. Go to Settings → API"
  echo "4. Copy the 'Service Role' key (marked as 'secret')"
  echo "5. Add to .env.local: VITE_SUPABASE_SERVICE_ROLE_KEY=your-key"
  exit 1
fi

echo -e "${GREEN}🚀 Setting up demo account...${NC}"
echo ""

# Create admin user
echo -e "${YELLOW}📝 Creating demo account: $DEMO_EMAIL${NC}"

RESPONSE=$(curl -s -X POST \
  "${VITE_SUPABASE_URL}/auth/v1/admin/users" \
  -H "Authorization: Bearer ${VITE_SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$DEMO_EMAIL\",
    \"password\": \"$DEMO_PASSWORD\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"role\": \"admin\",
      \"name\": \"Demo Admin\"
    }
  }")

# Check if user was created or already exists
if echo "$RESPONSE" | grep -q "user_id\|id"; then
  USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✓ Account created successfully${NC}"
  echo -e "${GREEN}  User ID: $USER_ID${NC}"
elif echo "$RESPONSE" | grep -q "already exists"; then
  echo -e "${GREEN}✓ Account already exists${NC}"
  # Try to get the user ID
  USER_ID=$(curl -s -X GET \
    "${VITE_SUPABASE_URL}/auth/v1/admin/users?email=$DEMO_EMAIL" \
    -H "Authorization: Bearer ${VITE_SUPABASE_SERVICE_ROLE_KEY}" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
else
  echo -e "${RED}❌ Failed to create user${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Demo setup complete!${NC}"
echo ""
echo -e "${YELLOW}📧 Email:${NC}    $DEMO_EMAIL"
echo -e "${YELLOW}🔐 Password:${NC}  $DEMO_PASSWORD"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Start the dev server: npm run dev"
echo "2. Go to http://localhost:5173/auth"
echo "3. Enter the credentials above"
echo "4. You'll be logged in and can start creating projects!"
echo ""
