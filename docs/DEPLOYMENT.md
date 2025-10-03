# 🚀 CFP Funding Tool - Deployment Guide

This guide covers deployment options for the CFP Funding Tool API. The service supports two primary deployment methods: **Railway** (recommended for production) and **Docker Compose** (recommended for development).

## 🚂 Railway Deployment (Production)

Railway is the recommended platform for production deployment, offering automatic scaling, managed PostgreSQL, and zero-downtime deployments.

### Quick Start

1. **Connect to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Add PostgreSQL Database**
   - In Railway project dashboard
   - Click "New Service" → "Database" → "Add PostgreSQL"
   - Wait for deployment (creates `DATABASE_URL` variable)

3. **Configure Environment Variables**
   
   In Railway dashboard → Variables tab, add:

   ```env
   # Database (Railway PostgreSQL)
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   
   # Blockchain Configuration
   GNOSIS_RPC_URL=https://rpc.gnosischain.com
   WXHOPR_TOKEN_ADDRESS=0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1
   
   # Security (Choose one method)
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

4. **Deploy and Initialize**
   - Railway automatically builds and deploys
   - Database migrations run automatically
   - Service available at `https://your-app.up.railway.app`

## 🐳 Docker Compose Deployment (Development)

Docker Compose provides a complete development environment with PostgreSQL, pgAdmin, and hot reloading.

### Quick Start

1. **Start Services**
   ```bash
   # Start all services (API + PostgreSQL)
   docker-compose up -d
   
   # Start with pgAdmin for database management
   docker-compose --profile admin up -d
   
   # View logs
   docker-compose logs -f api
   ```

2. **Access Services**
   - **API**: http://localhost:3000
   - **Database**: localhost:5432
   - **pgAdmin**: http://localhost:5050 (admin@cfp.local / admin123)

For detailed instructions, see the existing Railway documentation in `docs/deployment/railway.md`.
