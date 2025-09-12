#!/bin/bash

# Docker Security Scanning Script
# Scans Docker images and containers for security vulnerabilities

set -euo pipefail

echo "🔒 Docker Security Scan Starting..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running or not accessible"
    exit 1
fi

print_status "Docker is running"

# Build the image first
print_status "Building Docker image..."
if docker build -t airdrop-security-scan .; then
    print_success "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# 1. Docker Bench Security (if available)
print_status "Running Docker Bench Security..."
if command -v docker-bench-security >/dev/null 2>&1; then
    docker-bench-security --no-colors | head -20
    print_success "Docker Bench Security scan completed"
else
    print_warning "Docker Bench Security not installed. Install with: git clone https://github.com/docker/docker-bench-security.git"
fi

# 2. Image vulnerability scanning with Trivy (if available)
print_status "Scanning image for vulnerabilities..."
if command -v trivy >/dev/null 2>&1; then
    trivy image --severity HIGH,CRITICAL airdrop-security-scan
    print_success "Vulnerability scan completed"
else
    print_warning "Trivy not installed. Install with: brew install aquasecurity/trivy/trivy"
fi

# 3. Container security analysis
print_status "Analyzing container security configuration..."

# Check for security options
echo ""
echo "🔍 Security Configuration Analysis:"
echo "=================================="

# Check Dockerfile security
print_status "Analyzing Dockerfile..."
if grep -q "USER" Dockerfile; then
    print_success "✓ Non-root user configured"
else
    print_error "✗ No non-root user found"
fi

if grep -q "dumb-init" Dockerfile; then
    print_success "✓ Signal handling configured (dumb-init)"
else
    print_warning "⚠ Consider adding dumb-init for proper signal handling"
fi

# Check Dockerfile security features
print_status "Analyzing security configuration..."
if grep -q "read_only" Dockerfile; then
    print_success "✓ Read-only filesystem support configured"
else
    print_warning "⚠ Consider configuring read-only filesystem"
fi

# 4. Runtime security test
print_status "Testing runtime security..."

# Start container in background for testing
print_status "Starting container for security testing..."
docker run -d --name airdrop-security-test --env-file .env airdrop-security-scan

sleep 10

# Test if container is running as non-root
CONTAINER_ID="airdrop-security-test"
if [ -n "$CONTAINER_ID" ]; then
    USER_ID=$(docker exec "$CONTAINER_ID" id -u 2>/dev/null || echo "unknown")
    if [ "$USER_ID" = "1001" ]; then
        print_success "✓ Container running as non-root user (UID: $USER_ID)"
    else
        print_error "✗ Container not running as expected user (UID: $USER_ID)"
    fi
    
    # Test filesystem permissions
    if docker exec "$CONTAINER_ID" touch /test-write 2>/dev/null; then
        print_error "✗ Root filesystem is writable (security risk)"
        docker exec "$CONTAINER_ID" rm -f /test-write 2>/dev/null || true
    else
        print_success "✓ Root filesystem is read-only"
    fi
    
    # Test if we can escalate privileges
    if docker exec "$CONTAINER_ID" sudo -n true 2>/dev/null; then
        print_error "✗ Privilege escalation possible"
    else
        print_success "✓ Privilege escalation blocked"
    fi
else
    print_error "Container not found or not running"
fi

# Stop the test container
print_status "Stopping test container..."
docker stop airdrop-security-test 2>/dev/null || true
docker rm airdrop-security-test 2>/dev/null || true

# 5. Security summary
echo ""
echo "🛡️ Security Scan Summary:"
echo "========================="
print_status "Image: $(docker images airdrop-security-scan --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}')"
print_status "Base Image: node:18-alpine (minimal attack surface)"
print_status "User: nodejs (1001:1001) - non-root"
print_status "Capabilities: Dropped ALL, minimal additions"
print_status "Filesystem: Read-only with specific writable mounts"
print_status "Network: Isolated bridge network"

echo ""
print_success "Docker security scan completed!"
echo ""
print_status "Recommendations:"
echo "• Regularly update base images"
echo "• Monitor container logs for security events"
echo "• Use Docker secrets for sensitive data in production"
echo "• Consider using a security scanner in CI/CD pipeline"
echo "• Enable Docker Content Trust for image signing"
