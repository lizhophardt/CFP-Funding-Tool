#!/bin/bash

# Simple deployment script for CFP Funding Tool
# Usage: ./deploy-simple.sh [--dev]
set -e

# Check if running in development mode
DEV_MODE=false
if [ "$1" == "--dev" ]; then
    DEV_MODE=true
    echo "🧪 Starting in development mode..."
else
    echo "🚀 Starting in production mode..."
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker stop airdrop-service 2>/dev/null || true
docker rm airdrop-service 2>/dev/null || true

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t airdrop-service .

# Run the container
if [ "$DEV_MODE" = true ]; then
    # Development mode: mount source code and expose debug port
    echo "🧪 Running in development mode with:"
    echo "  - Source code mounted for hot reloading"
    echo "  - Debug port 9229 exposed"
    echo "  - App available at http://localhost:3000"
    
    docker run -d \
        --name airdrop-service \
        -p 3000:3000 \
        -p 9229:9229 \
        -v "$(pwd)/src:/app/src" \
        -v "$(pwd)/logs:/app/logs" \
        --env-file .env \
        airdrop-service npm run dev
else
    # Production mode: standard deployment
    echo "🚀 Running in production mode..."
    
    docker run -d \
        --name airdrop-service \
        -p 3000:3000 \
        --env-file .env \
        airdrop-service
fi

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 5

# Health check
echo "🏥 Checking service health..."
if curl -f http://localhost:3000/api/airdrop/health &> /dev/null; then
    echo "✅ Service is running successfully!"
    echo ""
    if [ "$DEV_MODE" = true ]; then
        echo "🧪 Development mode active:"
        echo "  📡 App: http://localhost:3000"
        echo "  🐛 Debug: localhost:9229 (attach your debugger)"
        echo "  📝 Logs: docker logs -f airdrop-service"
        echo "  🔄 Code changes will trigger automatic restart"
    else
        echo "🚀 Production mode active:"
        echo "  📡 App: http://localhost:3000"
        echo "  📝 Logs: docker logs -f airdrop-service"
    fi
    echo "  🛑 Stop: docker stop airdrop-service"
else
    echo "❌ Service failed to start. Check logs:"
    echo "docker logs airdrop-service"
    exit 1
fi
