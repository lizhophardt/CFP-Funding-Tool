#!/bin/bash

# wxHOPR Airdrop Frontend Deployment Script
# This script helps deploy the frontend to various hosting platforms

set -e  # Exit on any error

echo "🚀 wxHOPR Airdrop Frontend Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the frontend directory
if [[ ! -f "index.html" ]]; then
    print_error "Please run this script from the frontend directory"
    exit 1
fi

# Validate required files
print_info "Validating frontend files..."
required_files=("index.html" "styles.css" "script.js")

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        print_status "Found $file"
    else
        print_error "Missing required file: $file"
        exit 1
    fi
done

# Check API connectivity
print_info "Testing API connectivity..."
API_URL="https://cfp-fundingtool-api.up.railway.app/api/airdrop/health"

if curl -sf "$API_URL" > /dev/null; then
    print_status "API is accessible"
else
    print_warning "API connectivity test failed - deployment will continue"
fi

# Create deployment package
print_info "Creating deployment package..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOY_DIR="deploy_$TIMESTAMP"

mkdir -p "$DEPLOY_DIR"
cp index.html styles.css script.js "$DEPLOY_DIR/"

if [[ -f "favicon.ico" ]]; then
    cp favicon.ico "$DEPLOY_DIR/"
fi

print_status "Deployment package created: $DEPLOY_DIR"

# Display deployment instructions
echo ""
echo "📋 Deployment Instructions:"
echo "=========================="
echo ""

print_info "For ENS Domain (funding.lizhophart.eth):"
echo "1. IPFS Deployment (Recommended):"
echo "   - Install IPFS: https://ipfs.io/docs/install/"
echo "   - Add files: ipfs add -r $DEPLOY_DIR"
echo "   - Set ENS content hash to the returned IPFS hash"
echo ""

print_info "For Traditional Web Hosting:"
echo "1. Upload contents of '$DEPLOY_DIR' to your web server"
echo "2. Ensure HTTPS is enabled"
echo "3. Configure proper MIME types"
echo ""

print_info "For GitHub Pages:"
echo "1. git checkout -b gh-pages"
echo "2. git add $DEPLOY_DIR/*"
echo "3. git commit -m 'Deploy frontend'"
echo "4. git push origin gh-pages"
echo "5. Enable GitHub Pages in repository settings"
echo ""

print_info "For Vercel:"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. cd $DEPLOY_DIR"
echo "3. vercel --prod"
echo ""

print_info "For Netlify:"
echo "1. Install Netlify CLI: npm i -g netlify-cli"
echo "2. cd $DEPLOY_DIR"
echo "3. netlify deploy --prod --dir ."
echo ""

# Test local server option
echo ""
print_info "To test locally:"
echo "cd $DEPLOY_DIR && python3 -m http.server 8080"
echo "Then visit: http://localhost:8080"
echo ""

print_status "Frontend deployment package ready!"
print_info "API Endpoint: https://cfp-fundingtool-api.up.railway.app/api/airdrop"

echo ""
echo "🎯 Next Steps:"
echo "1. Choose your deployment method above"
echo "2. Upload the files from '$DEPLOY_DIR'"
echo "3. Test the deployed frontend"
echo "4. Update your ENS domain to point to the new frontend"
