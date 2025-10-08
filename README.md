# CFP Funding Tool

A secure, TypeScript-based REST API service for distributing wxHOPR tokens on Gnosis Chain through secret code validation with comprehensive security features and enterprise-grade logging.

## 🚀 Features

- 🔐 **Secret Code Validation**: Validates secret codes against configured valid codes
- 💰 **Dual Token Airdrops**: Sends both wxHOPR tokens and xDai to recipients
- 🚫 **Duplicate Prevention**: Prevents multiple claims with the same secret code
- 🛡️ **Enterprise Security**: Multi-layer input validation, rate limiting, and threat protection
- 📊 **Real-time Monitoring**: Service status, balance monitoring, and security dashboard
- 🧪 **Development Tools**: Test secret code generation and comprehensive testing suite
- 📝 **Professional Logging**: Winston-based logging with rotation and structured output
- 🐳 **Docker Ready**: Secure containerized deployment with hardened configuration
- 🔄 **RPC Failover**: Automatic failover between multiple RPC endpoints for high availability

## 🌐 RPC Reliability & Failover

The service implements robust RPC failover using Viem's fallback transport mechanism:

### Automatic Failover
- **Primary RPC**: Configured via `GNOSIS_RPC_URL`
- **Fallback RPCs**: Multiple endpoints via `GNOSIS_FALLBACK_RPC_URLS`
- **Smart Ranking**: Automatically ranks endpoints by latency and stability
- **Retry Logic**: 3 retries with 150ms delay between attempts
- **Zero Downtime**: Seamless switching between endpoints

### Default Fallback Endpoints
```
https://rpc.gnosischain.com          # Primary
https://gnosis-mainnet.public.blastapi.io  # Fallback 1
https://rpc.gnosis.gateway.fm        # Fallback 2
https://gnosis.drpc.org              # Fallback 3
```

### Configuration
```env
# Primary endpoint (required)
GNOSIS_RPC_URL=https://rpc.gnosischain.com

# Fallback endpoints (optional, comma-separated)
GNOSIS_FALLBACK_RPC_URLS=https://gnosis-mainnet.public.blastapi.io,https://rpc.gnosis.gateway.fm,https://gnosis.drpc.org
```

**Benefits:**
- 🔄 **High Availability**: Service continues running even if primary RPC fails
- ⚡ **Performance**: Automatic selection of fastest available endpoint
- 🛡️ **Resilience**: Protection against single point of failure
- 📊 **Monitoring**: Logs endpoint performance and failover events

## 📋 Quick Start

### 🧪 Development Mode (Recommended for Development)

```bash
# Quick development setup with hot reloading and debugging
./deploy.sh --dev

# Or use the development helper for common tasks
./dev-helper.sh start    # Start development environment
./dev-helper.sh logs     # Follow logs
./dev-helper.sh shell    # Access container shell
./dev-helper.sh debug    # Show debugger connection info
```

**Development Features:**
- 🔄 **Hot Reloading**: Source code changes trigger automatic restart
- 🐛 **Debug Port**: Node.js debugger on port 9229
- 📁 **Volume Mounts**: Code, logs, and data directories mounted for persistence
- 🔍 **Enhanced Logging**: Verbose logging for development debugging
- 🐚 **Shell Access**: Easy container access for troubleshooting

### 🚀 Production Mode

```bash
# Production deployment with security hardening
./deploy.sh --prod
```

**Production Features:**
- 🔒 **Read-only Filesystem**: Enhanced container security
- 🛡️ **Minimal Capabilities**: Dropped privileges and minimal access
- 📊 **Resource Limits**: CPU and memory constraints
- 🌐 **Localhost Binding**: Network isolation
- 🔄 **Auto Restart**: Automatic restart on failure

### 📦 Manual Installation

```bash
git clone <repository-url>
cd cfp-funding-tool
npm install
```

### 🗄️ Database Setup

The application requires PostgreSQL. Choose one option:

**Option 1: Using Docker (Recommended)**
```bash
# Start PostgreSQL with Docker
npm run db:setup

# Wait for database to be ready, then run migrations
npm run db:migrate

# Seed with initial secret codes (optional)
npm run db:seed
```

**Option 2: Local PostgreSQL Installation**
```bash
# Install PostgreSQL on your system first, then:
createdb cfp_funding_tool
psql cfp_funding_tool -f database/schema.sql

# Migrate secret codes from environment (optional)
npm run db:seed
```

### ⚙️ Configuration

```bash
# Copy environment template
cp env.example .env

# Edit with your configuration
nano .env
```

Required environment variables:
```env
# Gnosis Chain Configuration
GNOSIS_RPC_URL=https://rpc.gnosischain.com
# Optional fallback RPC endpoints for improved reliability (comma-separated)
GNOSIS_FALLBACK_RPC_URLS=https://gnosis-mainnet.public.blastapi.io,https://rpc.gnosis.gateway.fm,https://gnosis.drpc.org
WXHOPR_TOKEN_ADDRESS=0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1

# Security (choose one method)
PRIVATE_KEY=your_private_key_here                    # Basic (development only)

# Encrypted private key (RECOMMENDED for production)
# Generate with: npm run quick-encrypt
ENCRYPTED_PRIVATE_KEY=encrypted_key_here             # AES-256-CBC encrypted
ENCRYPTION_PASSWORD=your_encryption_password         # Strong password (12+ chars)

# Airdrop Configuration
SECRET_CODES=DontTellUncleSam,SecretCode123,HiddenTreasure
AIRDROP_AMOUNT_WEI=10000000000000000                 # 0.01 wxHOPR
XDAI_AIRDROP_AMOUNT_WEI=10000000000000000           # 0.01 xDai

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Development

**Prerequisites:** Ensure database is set up (see Database Setup section above)

```bash
# Development with hot reload (local)
npm run dev

# Development with Docker (recommended)
./deploy.sh --dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test
```

**⚠️ Important:** If you get a "Database connection failed" error, make sure PostgreSQL is running and properly configured in your `.env` file.

## 🌐 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/airdrop/claim` | Claim dual airdrop (wxHOPR + xDai) |
| `GET` | `/api/airdrop/status` | Get service status and balances |
| `GET` | `/api/airdrop/health` | Health check endpoint |
| `POST` | `/api/airdrop/generate-test-code` | Generate test secret code |

### Example Usage

**Claim Airdrop:**
```bash
curl -X POST http://localhost:3000/api/airdrop/claim \
  -H "Content-Type: application/json" \
  -d '{
    "secretCode": "DontTellUncleSam",
    "recipientAddress": "0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"
  }'
```

**Check Status:**
```bash
curl http://localhost:3000/api/airdrop/status
```

## 🏗️ Project Structure

```
├── src/
│   ├── controllers/         # Request handlers
│   ├── services/           # Business logic
│   ├── middleware/         # Express middleware (validation, security)
│   ├── routes/            # API route definitions
│   ├── utils/             # Utilities (logging, validation, security)
│   ├── config/            # Configuration management
│   ├── types/             # TypeScript type definitions
│   └── app.ts             # Express app setup
├── tests/                 # Comprehensive test suite
├── docs/                  # High-level tutorials and guides
├── scripts/               # Utility scripts
├── logs/                  # Application logs (auto-generated)
└── frontend/              # Web frontend (optional)
```

## 🔐 Security Features

The application implements multiple layers of security:

### Input Validation & Sanitization
- **Multi-layer validation**: Joi schemas + security pattern detection
- **XSS Protection**: Script tags, event handlers blocked
- **SQL Injection Prevention**: Database query patterns blocked
- **Command Injection Prevention**: Shell commands blocked
- **50+ malicious patterns** detected and blocked automatically

### Private Key Security
- **Encrypted Storage**: Support for encrypted private key storage using AES-256-CBC
- **Quick Encryption**: Use `npm run quick-encrypt` for secure key generation
- **Key Rotation**: Automated key management capabilities
- **Hardware Security Modules**: AWS KMS and HashiCorp Vault support

### Network Security
- **CSP Headers**: Content Security Policy protection
- **CORS Configuration**: Restricted origins for production
- **Rate Limiting**: Automatic IP blocking for repeated attacks
- **Security Monitoring**: Real-time threat detection and logging

### Container Security
- **Read-only filesystem**: Enhanced container security
- **Minimal capabilities**: Dropped privileges and minimal access
- **Resource limits**: CPU and memory constraints
- **Network isolation**: Localhost binding in production

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:security

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Coverage
- **Unit Tests**: Business logic and utilities
- **Integration Tests**: API endpoints and middleware
- **Security Tests**: Input validation and attack prevention
- **Coverage Target**: 70% minimum, 90% for security-critical code

## 📊 Monitoring & Logs

### Log Files
- **Application Logs**: `logs/combined-*.log`
- **Error Logs**: `logs/error-*.log`
- **Security Logs**: `logs/security-*.log`
- **Automatic Rotation**: Daily rotation with compression

### Monitoring Endpoints
- **Health Check**: `GET /api/airdrop/health`
- **Service Status**: `GET /api/airdrop/status`
- **Security Dashboard**: Real-time security metrics

### Key Metrics
- API response times and error rates
- Airdrop success/failure rates
- Security events and blocked attacks
- Token balance monitoring

## 🐛 Debugging

### VS Code Debugging

1. Start the development environment:
   ```bash
   ./deploy.sh --dev
   ```

2. In VS Code, go to Run and Debug (Ctrl+Shift+D)

3. Select "Attach to Docker (Development)" configuration

4. Set breakpoints in your TypeScript source files

### Chrome DevTools

1. Start development mode: `./deploy.sh --dev`
2. Open Chrome and navigate to: `chrome://inspect`
3. Click "Open dedicated DevTools for Node"
4. The debugger will connect to `localhost:9229`

## 📖 Documentation

For detailed guides on specific topics, see the [`docs/`](docs/) directory:

- **[Deployment Guide](docs/deployment.md)** - Comprehensive deployment instructions for Railway, Docker, and local environments
- **[Security Setup](docs/security.md)** - Security configuration and best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Quality Standards
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Comprehensive test coverage required
- Security-first development approach

## 📄 License

MIT License

## ⚠️ Security Notice

- Never commit private keys to version control
- Use encrypted private keys in production (`npm run quick-encrypt`)
- Regularly rotate secret codes
- Monitor security logs for threats
- Keep dependencies updated

---

**Need Help?** 
- Check the [`docs/`](docs/) directory for detailed guides
- Review the API documentation for endpoint details
- Run security validation scripts for troubleshooting
- Open an issue for bugs or feature requests