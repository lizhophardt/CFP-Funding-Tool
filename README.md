# Gnosis Chain wxHOPR Airdrop Service

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

### 1. Installation

```bash
git clone <repository-url>
cd gnosis-airdrop-service
npm install
```

### 2. Configuration

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

### 3. Development

```bash
# Development with hot reload
npm run dev

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

### Security Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/security/dashboard` | Real-time security dashboard |
| `GET` | `/api/security/stats` | Security statistics and metrics |
| `GET` | `/api/security/threats` | Threat response information |

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
├── docs/                  # Documentation
├── scripts/               # Utility scripts
├── logs/                  # Application logs (auto-generated)
└── frontend/              # Web frontend (optional)
```

## 🔐 Security Features

- **Multi-layer Input Validation**: Joi schemas + security pattern detection
- **Rate Limiting**: Global and endpoint-specific limits
- **Threat Protection**: Automatic IP blocking for repeated attacks
- **Private Key Encryption**: Support for encrypted private key storage
- **CSP Headers**: Content Security Policy protection
- **CORS Configuration**: Restricted origins for production
- **Security Monitoring**: Real-time threat detection and logging

## 🚀 Deployment

### Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t airdrop-service .
docker run -p 3000:3000 --env-file .env airdrop-service
```

### Cloud Platforms

- **Railway**: See [`docs/deployment/railway.md`](docs/deployment/railway.md)
- **Heroku**: See [`docs/deployment/heroku.md`](docs/deployment/heroku.md)
- **AWS/GCP/Azure**: See [`docs/deployment/cloud.md`](docs/deployment/cloud.md)

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [`docs/SECURITY.md`](docs/SECURITY.md) | Complete security setup guide |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Deployment instructions |
| [`docs/API.md`](docs/API.md) | Detailed API documentation |
| [`docs/FRONTEND.md`](docs/FRONTEND.md) | Frontend setup and usage |
| [`docs/TESTING.md`](docs/TESTING.md) | Testing guide |
| [`LOGGING_SYSTEM.md`](LOGGING_SYSTEM.md) | Logging implementation details |

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

## 📊 Monitoring & Logs

- **Application Logs**: `logs/combined-*.log`
- **Error Logs**: `logs/error-*.log`
- **Security Logs**: `logs/security-*.log`
- **Security Dashboard**: `http://localhost:3000/api/security/dashboard`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

- Never commit private keys to version control
- Use encrypted private keys in production
- Regularly rotate secret codes
- Monitor security logs for threats
- Keep dependencies updated

---

**Need Help?** Check the [`docs/`](docs/) directory for detailed guides or open an issue.