# Quick Deployment Guide

This guide provides quick and dirty deployment options for the Chiado xDai Airdrop Service.

## Prerequisites

- Node.js 18+ installed
- Docker installed (for containerized deployment)
- A Chiado testnet wallet with xDai for airdrops
- Your wallet private key (without 0x prefix)
- A secret preimage for hash validation

## Option 1: Docker Deployment (Recommended)

The fastest way to deploy with Docker:

### 1. Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

Required configuration:
- `PRIVATE_KEY`: Your wallet private key (without 0x prefix)
- `SECRET_PREIMAGE`: Your secret preimage for hash validation
- `AIRDROP_AMOUNT_WEI`: Amount to send per claim (default: 1 xDai)

### 2. Deploy with Script

```bash
# Make sure the script is executable (already done)
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

This script will:
- ✅ Validate your environment configuration
- 🛑 Stop any existing containers
- 🔨 Build and start the Docker container
- 🏥 Perform health checks
- 🎉 Confirm successful deployment

### 3. Manual Docker Commands (Alternative)

```bash
# Build and start with docker-compose
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

## Option 2: Quick Local Deployment

For development or testing without Docker:

### 1. Configure Environment

```bash
cp env.example .env
# Edit .env with your configuration
```

### 2. Deploy with Node.js Script

```bash
# Run the quick deploy script
npm run quick-deploy
# OR
node scripts/quick-deploy.js
```

### 3. Manual Local Deployment

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the service
npm start
```

## Option 3: NPM Scripts

Quick deployment using package.json scripts:

```bash
# Docker deployment
npm run deploy

# Local deployment
npm run quick-deploy

# Development mode
npm run dev
```

## Verification

After deployment, verify the service is running:

### Health Check
```bash
curl http://localhost:3000/api/airdrop/health
```

### Service Status
```bash
curl http://localhost:3000/api/airdrop/status
```

### Test Hash Generation
```bash
curl -X POST http://localhost:3000/api/airdrop/generate-test-hash \
  -H "Content-Type: application/json" \
  -d '{"preimage": "your_secret_preimage"}'
```

## Available Endpoints

Once deployed, your service will have these endpoints:

- `GET /api/airdrop/health` - Health check
- `GET /api/airdrop/status` - Service status and balance
- `POST /api/airdrop/claim` - Claim airdrop with hash
- `POST /api/airdrop/generate-test-hash` - Generate test hash

## Environment Variables

Key environment variables to configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `PRIVATE_KEY` | Wallet private key (without 0x) | Required |
| `SECRET_PREIMAGE` | Secret for hash validation | Required |
| `AIRDROP_AMOUNT_WEI` | Amount per claim in wei | 1000000000000000000 (1 xDai) |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `CHIADO_RPC_URL` | Chiado RPC endpoint | https://rpc.chiadochain.net |

## Troubleshooting

### Service Won't Start
- Check if `.env` file exists and is configured
- Verify `PRIVATE_KEY` and `SECRET_PREIMAGE` are set
- Ensure port 3000 is not in use

### Docker Issues
- Ensure Docker is running
- Try `docker-compose down && docker-compose up --build`

### Health Check Fails
- Wait 30-60 seconds for service to fully start
- Check logs: `docker-compose logs` or `npm run dev`

## Security Notes

- Keep your `PRIVATE_KEY` secure and never commit it to version control
- Use a dedicated wallet for production with appropriate xDai balance
- Consider using multiple preimages for better security
- Monitor your wallet balance regularly

## Quick Commands Reference

```bash
# Deploy with Docker
./deploy.sh

# Deploy locally
npm run quick-deploy

# Check health
curl http://localhost:3000/api/airdrop/health

# View Docker logs
docker-compose logs -f

# Stop Docker deployment
docker-compose down
```

That's it! Your airdrop service should now be running and ready to process claims.
