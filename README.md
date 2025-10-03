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
WXHOPR_TOKEN_ADDRESS=0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1

# Security (choose one method)
PRIVATE_KEY=your_private_key_here                    # Basic (development only)
ENCRYPTED_PRIVATE_KEY=encrypted_key_here             # Recommended
ENCRYPTION_PASSWORD=your_encryption_password         # With encrypted key

# Airdrop Configuration
SECRET_CODES=DontTellUncleSam,SecretCode123,HiddenTreasure
AIRDROP_AMOUNT_WEI=10000000000000000                 # 0.01 wxHOPR
XDAI_AIRDROP_AMOUNT_WEI=10000000000000000           # 0.01 xDai

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Development

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
- **Encrypted Storage**: Support for encrypted private key storage
- **Multiple Security Levels**: From basic encryption to enterprise Vault/KMS
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

## 🚀 Deployment

### Railway (Production - Recommended)

Railway provides managed PostgreSQL, automatic scaling, and zero-downtime deployments:

```bash
# 1. Connect your repository to Railway
# 2. Add PostgreSQL service
# 3. Configure environment variables
# 4. Automatic deployment from main branch
```

**Features:**
- 🔄 **Automatic Deployments**: Push to main branch triggers deployment
- 🗄️ **Managed PostgreSQL**: Database provided and managed automatically  
- 📈 **Auto Scaling**: Based on CPU/memory usage
- 🔒 **HTTPS by Default**: SSL certificates managed automatically
- 📊 **Built-in Monitoring**: Logs, metrics, and health checks

### Docker Compose (Development)

Complete development environment with hot reloading:

```bash
# Start development environment
docker-compose up -d

# Start with database admin interface
docker-compose --profile admin up -d

# View logs
docker-compose logs -f api
```

**Features:**
- 🔄 **Hot Reloading**: Code changes trigger automatic restart
- 🗄️ **PostgreSQL**: Local database with migrations
- 🔧 **pgAdmin**: Database management interface
- 🐛 **Debug Support**: Debug port exposed for IDE attachment

### Local Docker (Simple)

Quick local deployment for testing:

```bash
# Development mode
./deploy.sh --dev

# Production mode  
./deploy.sh
```

For detailed deployment instructions, see [`docs/deployment.md`](docs/deployment.md).

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

## 📖 Documentation

For detailed information on specific topics:

| Topic | Document | Description |
|-------|----------|-------------|
| **Deployment** | [`docs/deployment.md`](docs/deployment.md) | Comprehensive deployment guide |
| **Security** | [`docs/security.md`](docs/security.md) | Security setup and best practices |

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
- Use encrypted private keys in production
- Regularly rotate secret codes
- Monitor security logs for threats
- Keep dependencies updated

---

**Need Help?** 
- Check the [`docs/`](docs/) directory for detailed guides
- Review the API documentation for endpoint details
- Run security validation scripts for troubleshooting
- Open an issue for bugs or feature requests