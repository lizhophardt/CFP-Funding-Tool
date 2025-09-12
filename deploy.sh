#!/bin/bash

# Gnosis Chain wxHOPR Airdrop Service Deployment Script
# Supports both production deployment and local development setup
set -e

# Default configuration
DEV_MODE=false
CONTAINER_NAME="airdrop-service"
IMAGE_NAME="airdrop-service"
PORT=3000
DEBUG_PORT=9229
HELP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev|--development)
            DEV_MODE=true
            shift
            ;;
        --prod|--production)
            DEV_MODE=false
            shift
            ;;
        --name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --debug-port)
            DEBUG_PORT="$2"
            shift 2
            ;;
        --help|-h)
            HELP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            HELP=true
            shift
            ;;
    esac
done

# Show help if requested or invalid arguments
if [ "$HELP" = true ]; then
    echo "Gnosis Chain wxHOPR Airdrop Service Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --dev, --development     Run in development mode with debugging features"
    echo "  --prod, --production     Run in production mode (default)"
    echo "  --name NAME             Set custom container name (default: airdrop-service)"
    echo "  --port PORT             Set custom port (default: 3000)"
    echo "  --debug-port PORT       Set Node.js debug port (default: 9229, dev mode only)"
    echo "  --help, -h              Show this help message"
    echo ""
    echo "DEVELOPMENT MODE FEATURES:"
    echo "  ✅ Volume mounts for hot reloading"
    echo "  ✅ Node.js debug port exposed"
    echo "  ✅ Development environment variables"
    echo "  ✅ Verbose logging"
    echo "  ✅ Non-hardened security for easier debugging"
    echo ""
    echo "PRODUCTION MODE FEATURES:"
    echo "  ✅ Security hardened container"
    echo "  ✅ Read-only filesystem"
    echo "  ✅ Minimal capabilities"
    echo "  ✅ Resource limits"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                       # Production deployment"
    echo "  $0 --dev                 # Development mode"
    echo "  $0 --dev --port 8080     # Development mode on port 8080"
    echo "  $0 --dev --name my-dev   # Development mode with custom name"
    exit 0
fi

if [ "$DEV_MODE" = true ]; then
    echo "🧪 Starting Gnosis Chain wxHOPR Airdrop Service in DEVELOPMENT mode..."
    echo "   📝 Hot reloading enabled"
    echo "   🐛 Debug port: $DEBUG_PORT"
    echo "   🔓 Security hardening disabled for easier debugging"
else
    echo "🚀 Starting Gnosis Chain wxHOPR Airdrop Service in PRODUCTION mode..."
    echo "   🔒 Security hardening enabled"
    echo "   🛡️  Read-only filesystem with minimal capabilities"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from env.example..."
    cp env.example .env
    echo "✅ Created .env file. Please edit it with your configuration before running again."
    echo ""
    echo "Required configuration:"
    echo "  - PRIVATE_KEY: Your wallet private key (without 0x prefix)"
    echo "  - SECRET_PREIMAGE: Your secret preimage for hash validation"
    echo "  - AIRDROP_AMOUNT_WEI: Amount to send per claim (default: 0.01 wxHOPR)"
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

if [ -z "$SECRET_CODES" ]; then
    echo "❌ SECRET_CODES is not configured in .env file"
    exit 1
fi

echo "✅ Found PRIVATE_KEY (length: ${#PRIVATE_KEY})"
echo "✅ Found SECRET_CODES (length: ${#SECRET_CODES})"

echo "✅ Environment configuration validated"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# Build the service
echo "🔨 Building Docker image..."
if [ "$DEV_MODE" = true ]; then
    # Development build - include dev dependencies for hot reloading
    docker build -t "$IMAGE_NAME" --target development . 2>/dev/null || \
    docker build -t "$IMAGE_NAME" .
else
    # Production build
    docker build -t "$IMAGE_NAME" .
fi

# Prepare Docker run command based on mode
echo "🚀 Starting the service..."

if [ "$DEV_MODE" = true ]; then
    # Development mode - optimized for debugging and development
    echo "   🔧 Configuring development environment..."
    
    # Create development environment file
    cat > .env.dev <<EOF
NODE_ENV=development
DEBUG=*
LOG_LEVEL=debug
ENABLE_CORS=true
EOF
    
    # Run container with development configuration
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "$PORT:3000" \
        -p "$DEBUG_PORT:9229" \
        --env-file .env \
        --env-file .env.dev \
        -v "$(pwd)/src:/app/src:ro" \
        -v "$(pwd)/logs:/app/logs" \
        -v "$(pwd)/data:/app/data" \
        -e NODE_OPTIONS="--inspect=0.0.0.0:9229" \
        --user root \
        --cap-add SYS_PTRACE \
        "$IMAGE_NAME" npm run dev:watch
        
    echo "   ✅ Development container started with:"
    echo "      📱 App port: $PORT"
    echo "      🐛 Debug port: $DEBUG_PORT (for Node.js debugging)"
    echo "      📁 Source code mounted for hot reloading"
    echo "      📊 Logs mounted to ./logs/"
    echo "      💾 Data mounted to ./data/"
    
else
    # Production mode - security hardened
    echo "   🔒 Configuring production security..."
    
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "127.0.0.1:$PORT:3000" \
        --env-file .env \
        --read-only \
        --tmpfs /tmp:noexec,nosuid,nodev,size=100m \
        --tmpfs /app/logs:noexec,nosuid,nodev,size=50m \
        --security-opt no-new-privileges:true \
        --cap-drop=ALL \
        --cap-add=NET_BIND_SERVICE \
        --cpus="0.5" \
        --memory="512m" \
        --pids-limit=100 \
        --restart=unless-stopped \
        "$IMAGE_NAME"
        
    echo "   ✅ Production container started with security hardening:"
    echo "      🔒 Read-only filesystem"
    echo "      🛡️  Minimal capabilities"
    echo "      📊 Resource limits (0.5 CPU, 512MB RAM)"
    echo "      🌐 Localhost-only binding"
fi

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
if [ "$DEV_MODE" = true ]; then
    sleep 5  # Development mode typically starts faster
else
    sleep 10  # Production mode needs more time for security setup
fi

# Health check
echo "🏥 Performing health check..."
HEALTH_URL="http://localhost:$PORT/api/airdrop/health"

# Try health check with retries
RETRY_COUNT=0
MAX_RETRIES=6
HEALTH_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f "$HEALTH_URL" &> /dev/null; then
        HEALTH_SUCCESS=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   ⏳ Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying in 5 seconds..."
    sleep 5
done

if [ "$HEALTH_SUCCESS" = true ]; then
    echo "✅ Service is healthy and running!"
    echo ""
    if [ "$DEV_MODE" = true ]; then
        echo "🧪 DEVELOPMENT deployment successful!"
        echo ""
        echo "🔧 Development Features Available:"
        echo "  📱 Application: http://localhost:$PORT"
        echo "  📡 Health Check: http://localhost:$PORT/api/airdrop/health"
        echo "  📊 Status: http://localhost:$PORT/api/airdrop/status"
        echo "  💰 Claim Endpoint: http://localhost:$PORT/api/airdrop/claim"
        echo "  🐛 Debug Port: $DEBUG_PORT (attach your debugger here)"
        echo ""
        echo "🛠️  Development Commands:"
        echo "  📋 View logs: docker logs -f $CONTAINER_NAME"
        echo "  🔍 Follow logs: docker logs -f $CONTAINER_NAME | grep -E '(ERROR|WARN|DEBUG)'"
        echo "  🐚 Shell access: docker exec -it $CONTAINER_NAME /bin/sh"
        echo "  📊 Container stats: docker stats $CONTAINER_NAME"
        echo "  🛑 Stop service: docker stop $CONTAINER_NAME"
        echo "  🔄 Restart service: docker restart $CONTAINER_NAME"
        echo ""
        echo "📝 Development Notes:"
        echo "  - Source code changes will trigger automatic reload"
        echo "  - Logs are mounted to ./logs/ directory"
        echo "  - Data persists in ./data/ directory"
        echo "  - Debug with: node --inspect-brk=0.0.0.0:$DEBUG_PORT"
        echo ""
        echo "🚀 To switch to production mode: $0 --prod"
    else
        echo "🎉 PRODUCTION deployment successful!"
        echo ""
        echo "🔒 Production Service Available:"
        echo "  📡 Health Check: http://localhost:$PORT/api/airdrop/health"
        echo "  📊 Status: http://localhost:$PORT/api/airdrop/status"
        echo "  💰 Claim Endpoint: http://localhost:$PORT/api/airdrop/claim"
        echo ""
        echo "🛡️  Production Security Features:"
        echo "  ✅ Read-only filesystem"
        echo "  ✅ Minimal capabilities (no root access)"
        echo "  ✅ Resource limits (0.5 CPU, 512MB RAM)"
        echo "  ✅ Localhost-only binding"
        echo "  ✅ Automatic restart on failure"
        echo ""
        echo "🛠️  Production Commands:"
        echo "  📋 View logs: docker logs -f $CONTAINER_NAME"
        echo "  📊 Container stats: docker stats $CONTAINER_NAME"
        echo "  🛑 Stop service: docker stop $CONTAINER_NAME"
        echo "  🔄 Restart service: docker restart $CONTAINER_NAME"
        echo ""
        echo "🧪 To switch to development mode: $0 --dev"
    fi
    
    # Clean up temporary development environment file
    [ -f .env.dev ] && rm -f .env.dev
    
else
    echo "❌ Health check failed after $MAX_RETRIES attempts."
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  📋 Check logs: docker logs $CONTAINER_NAME"
    echo "  📊 Check status: docker ps -a"
    echo "  🔧 Check port: netstat -tlnp | grep $PORT"
    echo ""
    if [ "$DEV_MODE" = true ]; then
        echo "🧪 Development troubleshooting:"
        echo "  🐚 Shell access: docker exec -it $CONTAINER_NAME /bin/sh"
        echo "  📁 Check mounts: docker inspect $CONTAINER_NAME | grep -A 10 Mounts"
        echo "  🐛 Debug mode: Check if debug port $DEBUG_PORT is accessible"
    fi
    
    # Clean up on failure
    [ -f .env.dev ] && rm -f .env.dev
    exit 1
fi
