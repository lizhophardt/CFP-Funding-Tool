# 🚀 Quick Start with Encrypted Private Keys

This guide shows you the **fastest way** to deploy the CFP Funding Tool with secure, encrypted private keys.

## ⚡ Quick Setup

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd CFP-Funding-Tool
npm install
```

### 2. Setup Database
```bash
# Start PostgreSQL with Docker (recommended)
npm run db:setup

# Wait for database to be ready, then run migrations
npm run db:migrate

# Seed with initial secret codes (optional)
npm run db:seed
```

### 3. Encrypt Your Private Key
```bash
npm run quick-encrypt
```

**Follow the prompts:**
- Enter your private key (without `0x`)
- Enter a strong password (12+ characters)
- Copy the output

### 4. Configure Environment
```bash
cp env.example .env
nano .env  # or use your preferred editor
```

**Paste the encrypted values:**
```env
# Replace these with your encrypted values from step 3
ENCRYPTED_PRIVATE_KEY=a1b2c3d4e5f6...your_encrypted_key_here
ENCRYPTION_PASSWORD=YourSecurePassword123!

# Comment out the plain text key
# PRIVATE_KEY=your_private_key_here
```

### 5. Deploy
```bash
# Local development
npm run dev

# Docker development
docker-compose up -d

# Production (Railway)
# Just push to GitHub and configure Railway with the encrypted values
```

## 🔒 What's Happening Behind the Scenes?

### Encryption Algorithm
- **AES-256-CBC**: Industry-standard symmetric encryption
- **PBKDF2**: Key derivation with 100,000 iterations
- **SHA-256**: Cryptographic hash function
- **Random Salt & IV**: Unique encryption each time

### Security Benefits
- ✅ Private key is never stored in plain text
- ✅ Even if `.env` is compromised, key is encrypted
- ✅ Password can be stored separately from encrypted key
- ✅ Meets enterprise security standards

## 🛠️ Available Tools

| Command | Description |
|---------|-------------|
| `npm run quick-encrypt` | Quick encryption tool (recommended) |
| `npm run encrypt-key` | Standard encryption tool |
| `npm run key-helper` | Full CLI helper with decrypt/validate |

## 🚀 Deployment Options

### Railway (Production)
1. Run `npm run quick-encrypt` locally
2. Push code to GitHub
3. Connect repository to Railway
4. Add PostgreSQL service
5. Set environment variables with encrypted values
6. Deploy automatically

### Docker Compose (Development)
1. Run `npm run quick-encrypt` locally
2. Update `.env` with encrypted values
3. Run `docker-compose up -d`
4. Access at `http://localhost:3000`

## 🆘 Need Help?

### Quick Commands
```bash
# Validate your private key format
npm run key-helper validate

# Generate deployment config
npm run key-helper generate-config

# Decrypt key for verification
npm run key-helper decrypt
```

### Common Issues
- **"Invalid private key format"**: Ensure 64 hex characters, no `0x` prefix
- **"Password too short"**: Use at least 12 characters
- **"Decryption failed"**: Check password and encrypted key match

### Get Full Documentation
- [Complete Deployment Guide](docs/deployment.md)
- [Security Documentation](docs/security.md)

---

**That's it!** Your private key is now securely encrypted and ready for production deployment. 🎉
