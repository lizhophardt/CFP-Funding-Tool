#!/bin/bash

# Quick deployment script for Gnosis Chain wxHOPR Airdrop Service
set -e

echo "🚀 Starting Gnosis Chain wxHOPR Airdrop Service deployment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from env.example..."
    cp env.example .env
    echo "✅ Created .env file. Please edit it with your configuration before running again."
    echo ""
    echo "Required configuration:"
    echo "  - PRIVATE_KEY: Your wallet private key (without 0x prefix)"
    echo "  - SECRET_PREIMAGE: Your secret preimage for hash validation"
    echo "  - AIRDROP_AMOUNT_WEI: Amount to send per claim (default: 1 wxHOPR)"
    echo ""
    echo "Run this script again after configuring your .env file."
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY is empty in .env file"
    exit 1
fi

if [ -z "$SECRET_PREIMAGE" ] && [ -z "$SECRET_PREIMAGES" ]; then
    echo "❌ Neither SECRET_PREIMAGE nor SECRET_PREIMAGES is configured in .env file"
    exit 1
fi

echo "✅ Found PRIVATE_KEY (length: ${#PRIVATE_KEY})"
if [ -n "$SECRET_PREIMAGES" ]; then
    echo "✅ Found SECRET_PREIMAGES (length: ${#SECRET_PREIMAGES})"
else
    echo "✅ Found SECRET_PREIMAGE (length: ${#SECRET_PREIMAGE})"
fi

echo "✅ Environment configuration validated"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Build and start the service
echo "🔨 Building and starting the service..."
docker-compose up --build -d

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 10

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3000/api/airdrop/health &> /dev/null; then
    echo "✅ Service is healthy and running!"
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "Service is now available at:"
    echo "  📡 Health Check: http://localhost:3000/api/airdrop/health"
    echo "  📊 Status: http://localhost:3000/api/airdrop/status"
    echo "  💰 Claim Endpoint: http://localhost:3000/api/airdrop/claim"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
else
    echo "❌ Health check failed. Service may not be ready yet."
    echo "Check logs with: docker-compose logs"
    exit 1
fi
