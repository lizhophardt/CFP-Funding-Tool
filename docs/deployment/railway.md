# 🚂 Railway Deployment Guide

## Quick Railway Deployment

Railway provides an easy way to deploy the wxHOPR Airdrop Service with automatic builds and deployments. This service now uses PostgreSQL for persistent storage of secret codes and usage tracking.

> **⚠️ IMPORTANT**: Starting with v2.1.0, this service requires a PostgreSQL database. Railway provides PostgreSQL as an add-on service.

## 📋 Environment Variables for Railway

Copy these environment variables to your Railway dashboard:

### Required Variables

```env
# Database Configuration (Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Blockchain Configuration
GNOSIS_RPC_URL=https://rpc.gnosischain.com
GNOSIS_FALLBACK_RPC_URLS=https://rpc.ankr.com/gnosis,https://gnosis-mainnet.public.blastapi.io,https://gnosis.blockpi.network/v1/rpc/public
WXHOPR_TOKEN_ADDRESS=0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1

# Security - Choose ONE method
PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
# OR (Recommended)
ENCRYPTED_PRIVATE_KEY=your_encrypted_private_key
ENCRYPTION_PASSWORD=your_encryption_password

# Airdrop Configuration
AIRDROP_AMOUNT_WEI=10000000000000000
XDAI_AIRDROP_AMOUNT_WEI=10000000000000000

# Server Configuration
PORT=3000
NODE_ENV=production
```

> **📝 Note**: `SECRET_CODES` environment variable is no longer used. Secret codes are now managed in the PostgreSQL database.

### Optional Variables

```env
# Legacy Secret Codes (for initial migration only)
SECRET_CODES=Code1,Code2,Code3,Code4

# Custom RPC URL
GNOSIS_RPC_URL=https://your-custom-rpc-endpoint.com

# Custom Fallback RPC URLs (comma-separated)
GNOSIS_FALLBACK_RPC_URLS=https://rpc1.example.com,https://rpc2.example.com

# Custom Token Address (if using different token)
WXHOPR_TOKEN_ADDRESS=0xYourCustomTokenAddress

# Database SSL (usually true for production)
DB_SSL=true
```

## 🚀 Deployment Steps

### 1. Prepare Your Repository

Ensure your repository has:
- `package.json` with build scripts
- `Dockerfile` (optional, Railway auto-detects Node.js)
- Database schema files in `database/` directory
- Environment variables configured

### 2. Connect to Railway

1. Visit [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### 3. Add PostgreSQL Database

**IMPORTANT: Do this BEFORE deploying the application**

1. In your Railway project dashboard
2. Click "New Service" → "Database" → "Add PostgreSQL"
3. Wait for PostgreSQL to deploy (this creates the `DATABASE_URL` variable)
4. The database will be automatically linked to your project

### 4. Configure Environment Variables

In Railway dashboard:
1. Go to your project
2. Click on your application service (not the database)
3. Click "Variables" tab
4. Add all required environment variables (see list above)
5. For `DATABASE_URL`, use: `${{Postgres.DATABASE_URL}}`

### 5. Deploy and Initialize Database

Railway will automatically:
- Detect Node.js project
- Run `npm install`
- Run `npm run build`
- Start with `npm start`
- Connect to PostgreSQL and run migrations

### 6. Migrate Secret Codes (One-time Setup)

After successful deployment, migrate your secret codes to the database:

```bash
# Option 1: Use Railway CLI
railway connect
node scripts/migrate-secret-codes.js

# Option 2: Set SECRET_CODES environment variable temporarily
# The system will automatically migrate codes on first startup
```

## 🔒 Security Best Practices

### Private Key Security

**Option 1: Encrypted Private Key (Recommended)**
```bash
# Generate encrypted key locally
npm run encrypt-key
# Use the output for ENCRYPTED_PRIVATE_KEY and ENCRYPTION_PASSWORD
```

**Option 2: Railway Environment Variables**
- Never commit private keys to git
- Use Railway's secure environment variables
- Consider rotating keys regularly

### Network Security

- Railway provides HTTPS by default
- Your service will be available at `https://your-app.up.railway.app`
- Configure CORS for your frontend domain

## 📊 Monitoring

### Railway Dashboard

Monitor your deployment:
- **Deployments**: View build and deployment logs
- **Metrics**: CPU, memory, and network usage
- **Logs**: Real-time application logs
- **Variables**: Manage environment variables

### Application Logs

Access logs through:
```bash
# Railway CLI
railway logs

# Or in Railway dashboard under "Logs" tab
```

## 🔧 Custom Domain

### Setup Custom Domain

1. In Railway dashboard, go to "Settings"
2. Click "Domains"
3. Add your custom domain
4. Configure DNS records as shown
5. Railway provides automatic SSL certificates

### DNS Configuration

Add these records to your domain:
```
CNAME: your-domain.com -> your-app.up.railway.app
```

## 🚨 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check build logs in Railway dashboard
# Ensure all dependencies are in package.json
# Verify Node.js version compatibility
```

**Environment Variable Issues:**
- Double-check variable names (case-sensitive)
- Ensure no extra spaces in values
- Verify private key format (no 0x prefix)

**Connection Issues:**
- Check GNOSIS_RPC_URL is accessible
- Verify wallet has sufficient balance
- Ensure token address is correct

### Debug Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# View logs
railway logs

# Connect to your project
railway link

# Run commands in Railway environment
railway run npm run status
```

## 📈 Scaling

### Auto-scaling

Railway automatically scales based on:
- CPU usage
- Memory usage
- Request volume

### Resource Limits

Default limits:
- **Memory**: 512MB (upgradeable)
- **CPU**: Shared (upgradeable to dedicated)
- **Storage**: 1GB (upgradeable)

### Performance Optimization

```javascript
// In your app, add health checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

## 💰 Pricing

Railway pricing tiers:
- **Hobby**: $5/month (512MB RAM, shared CPU)
- **Pro**: $20/month (8GB RAM, dedicated CPU)
- **Team**: Custom pricing

## 🔄 Updates and Deployments

### Automatic Deployments

Railway automatically deploys when you:
- Push to main branch
- Update environment variables
- Manual redeploy from dashboard

### Manual Deployment

```bash
# Using Railway CLI
railway up

# Or redeploy from dashboard
```

### Rollback

In Railway dashboard:
1. Go to "Deployments"
2. Find previous successful deployment
3. Click "Redeploy"

## 📞 Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: Community support
- **GitHub Issues**: For application-specific issues

---

For other deployment options, see:
- [Docker Deployment](../DEPLOYMENT.md#docker-deployment)
- [Cloud Deployment](cloud.md)
- [Frontend Deployment](../FRONTEND.md#deployment-options)
