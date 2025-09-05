#!/bin/bash

# Docker Secrets Setup Script
# Sets up Docker secrets for production deployment

set -euo pipefail

echo "🔐 Docker Secrets Setup"
echo "======================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker Swarm is initialized
if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
    print_status "Initializing Docker Swarm for secrets support..."
    docker swarm init --advertise-addr 127.0.0.1
    print_success "Docker Swarm initialized"
else
    print_status "Docker Swarm already active"
fi

# Function to create a Docker secret
create_secret() {
    local secret_name="$1"
    local env_var="$2"
    local description="$3"
    
    if [ -z "${!env_var:-}" ]; then
        print_warning "Environment variable $env_var not set, skipping $secret_name"
        return 0
    fi
    
    # Remove existing secret if it exists
    if docker secret ls --format '{{.Name}}' | grep -q "^$secret_name$"; then
        print_status "Removing existing secret: $secret_name"
        docker secret rm "$secret_name" || true
    fi
    
    # Create new secret
    print_status "Creating secret: $secret_name ($description)"
    echo -n "${!env_var}" | docker secret create "$secret_name" -
    print_success "Secret $secret_name created successfully"
}

# Load environment variables from .env if it exists
if [ -f .env ]; then
    print_status "Loading environment variables from .env"
    set -a  # automatically export all variables
    source .env
    set +a
    print_success "Environment variables loaded"
else
    print_warning ".env file not found. Please set environment variables manually."
fi

echo ""
print_status "Creating Docker secrets..."

# Create secrets for sensitive data
create_secret "airdrop_encrypted_private_key" "ENCRYPTED_PRIVATE_KEY" "Encrypted wallet private key"
create_secret "airdrop_encryption_password" "ENCRYPTION_PASSWORD" "Private key encryption password"
create_secret "airdrop_secret_preimage" "SECRET_PREIMAGE" "Secret preimage for hash generation"
create_secret "airdrop_secret_preimages" "SECRET_PREIMAGES" "Multiple secret preimages"

echo ""
print_status "Listing created secrets..."
docker secret ls

echo ""
print_success "Docker secrets setup completed!"
echo ""
print_status "Usage:"
echo "• Use 'docker-compose -f docker-compose.prod.yml up' for production"
echo "• Secrets are mounted at /run/secrets/<secret_name> in containers"
echo "• Update your application to read from /run/secrets/ instead of environment variables"
echo ""
print_warning "Security Notes:"
echo "• Secrets are encrypted at rest and in transit"
echo "• Only containers with access can read the secrets"
echo "• Rotate secrets regularly using: docker secret rm <name> && docker secret create <name> -"
echo "• Never commit secrets to version control"

# Create a helper script for reading secrets in the application
cat > scripts/read-docker-secrets.js << 'EOF'
#!/usr/bin/env node

/**
 * Docker Secrets Reader Utility
 * Reads secrets from Docker secrets or falls back to environment variables
 */

const fs = require('fs');
const path = require('path');

class DockerSecretsReader {
  static read(secretName, envVarName = null) {
    const secretPath = path.join('/run/secrets', secretName);
    
    try {
      // Try to read from Docker secret first
      if (fs.existsSync(secretPath)) {
        const secret = fs.readFileSync(secretPath, 'utf8').trim();
        console.log(`✓ Read secret from Docker: ${secretName}`);
        return secret;
      }
    } catch (error) {
      console.warn(`⚠ Failed to read Docker secret ${secretName}:`, error.message);
    }
    
    // Fall back to environment variable
    if (envVarName && process.env[envVarName]) {
      console.log(`✓ Read from environment variable: ${envVarName}`);
      return process.env[envVarName];
    }
    
    console.error(`✗ Secret not found: ${secretName} (env: ${envVarName})`);
    return null;
  }
  
  static readRequired(secretName, envVarName = null) {
    const value = this.read(secretName, envVarName);
    if (!value) {
      throw new Error(`Required secret not found: ${secretName}`);
    }
    return value;
  }
}

// Example usage
if (require.main === module) {
  console.log('Docker Secrets Reader Test');
  console.log('==========================');
  
  const secrets = [
    { name: 'airdrop_encrypted_private_key', env: 'ENCRYPTED_PRIVATE_KEY' },
    { name: 'airdrop_encryption_password', env: 'ENCRYPTION_PASSWORD' },
    { name: 'airdrop_secret_preimage', env: 'SECRET_PREIMAGE' }
  ];
  
  secrets.forEach(({ name, env }) => {
    try {
      const value = DockerSecretsReader.read(name, env);
      console.log(`${name}: ${value ? '✓ Found' : '✗ Not found'}`);
    } catch (error) {
      console.error(`${name}: ✗ Error - ${error.message}`);
    }
  });
}

module.exports = DockerSecretsReader;
EOF

chmod +x scripts/read-docker-secrets.js
print_success "Created Docker secrets reader utility: scripts/read-docker-secrets.js"
