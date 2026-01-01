#!/bin/bash

# Deploy All Web3 Edge Functions
# This script deploys all blockchain-related edge functions to Supabase
# Requires: supabase CLI installed and authenticated

set -e

echo "🚀 Deploying Web3 Edge Functions to Supabase..."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're in the project root
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠${NC} Not in project root. Please run this script from the OmniLink-APEX directory."
    exit 1
fi

echo -e "${BLUE}ℹ${NC} This will deploy the following functions:"
echo "  1. web3-nonce (generates signature nonce)"
echo "  2. web3-verify (verifies wallet signature)"
echo "  3. verify-nft (checks NFT ownership)"
echo "  4. alchemy-webhook (processes blockchain events)"
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "Deploying functions..."
echo "====================="

# Function to deploy and check result
deploy_function() {
    local func_name=$1
    echo -e "\n${BLUE}→${NC} Deploying $func_name..."

    if supabase functions deploy "$func_name"; then
        echo -e "${GREEN}✓${NC} $func_name deployed successfully"
    else
        echo -e "${RED}✗${NC} Failed to deploy $func_name"
        return 1
    fi
}

# Deploy each function
FAILED=0

deploy_function "web3-nonce" || ((FAILED++))
deploy_function "web3-verify" || ((FAILED++))
deploy_function "verify-nft" || ((FAILED++))
deploy_function "alchemy-webhook" || ((FAILED++))

echo ""
echo "Deployment Summary:"
echo "==================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All functions deployed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify environment variables are set in Supabase Dashboard"
    echo "2. Test each endpoint with curl or Postman"
    echo "3. Configure Alchemy webhook to point to your alchemy-webhook function"
    echo ""
    echo "Function URLs:"
    PROJECT_ID=$(grep "project_id" supabase/config.toml | cut -d'"' -f2 | tr -d ' ' | cut -d'=' -f2 | tr -d '"')
    echo "  web3-nonce: https://$PROJECT_ID.supabase.co/functions/v1/web3-nonce"
    echo "  web3-verify: https://$PROJECT_ID.supabase.co/functions/v1/web3-verify"
    echo "  verify-nft: https://$PROJECT_ID.supabase.co/functions/v1/verify-nft"
    echo "  alchemy-webhook: https://$PROJECT_ID.supabase.co/functions/v1/alchemy-webhook"
    exit 0
else
    echo -e "${RED}✗ $FAILED function(s) failed to deploy.${NC}"
    echo "Check the errors above and try again."
    exit 1
fi
