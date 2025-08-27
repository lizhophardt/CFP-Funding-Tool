# Gnosis Chain xDai Airdrop Service

A TypeScript-based REST API service for distributing xDai tokens on Gnosis Chain through hash validation. The service validates a secret hash against a preimage and sends xDai to the recipient address if the validation succeeds.

## Features

- 🔐 **Hash Validation**: Validates SHA-256 hashes against a configured preimage
- 💰 **Automated Airdrops**: Sends xDai on Gnosis Chain to valid recipients
- 🚫 **Duplicate Prevention**: Prevents multiple claims with the same hash
- 🛡️ **Security**: Built-in validation, rate limiting, and error handling
- 📊 **Status Monitoring**: Real-time service status and balance monitoring
- 🧪 **Development Tools**: Test hash generation for development

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Gnosis Chain RPC URL
GNOSIS_RPC_URL=https://rpc.gnosischain.com

# Private key for the wallet that will send xDai on Gnosis Chain (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Secret preimage for hash validation
SECRET_PREIMAGE=your_secret_preimage_here

# Amount of xDai to send per successful claim (in wei) on Gnosis Chain
AIRDROP_AMOUNT_WEI=1000000000000000000

# Server configuration
PORT=3000
NODE_ENV=development
```

### 3. Build and Run

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Endpoints

### POST `/api/airdrop/claim`

Claim an airdrop by providing a valid hash and recipient address.

**Request Body:**
```json
{
  "hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
  "recipientAddress": "0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Airdrop sent successfully",
  "transactionHash": "0x...",
  "amount": "1000000000000000000"
}
```

### GET `/api/airdrop/status`

Get service status, balance, and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "accountAddress": "0x...",
    "balance": "10.5 xDai",
    "processedCount": 42
  }
}
```

### POST `/api/airdrop/generate-test-hash`

Generate a test hash for development purposes.

**Request Body:**
```json
{
  "preimage": "hello world"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preimage": "hello world",
    "hash": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
  }
}
```

### GET `/api/airdrop/health`

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Airdrop service is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Hash Validation

The service uses SHA-256 for hash validation:

1. You configure a secret preimage in the environment variables
2. Users generate a SHA-256 hash of this preimage
3. The service validates the provided hash against the expected hash
4. If valid, the service sends xDai to the recipient address

### Example Hash Generation

```javascript
const crypto = require('crypto');
const preimage = "your_secret_preimage";
const hash = crypto.createHash('sha256').update(preimage, 'utf8').digest('hex');
console.log(hash); // Use this hash in your airdrop claim
```

## Security Features

- **Input Validation**: All inputs are validated for format and security
- **Duplicate Prevention**: Each hash can only be used once
- **Address Validation**: Ethereum addresses are validated before transactions
- **Balance Checks**: Ensures sufficient balance before sending transactions
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Built-in protection against abuse

## Development

### Project Structure

```
src/
├── config/           # Configuration management
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── app.ts           # Express app setup
└── index.ts         # Application entry point
```

### Testing

Generate a test hash for your configured preimage:

```bash
curl -X POST http://localhost:3000/api/airdrop/generate-test-hash \
  -H "Content-Type: application/json" \
  -d '{"preimage": "your_secret_preimage"}'
```

Then use the returned hash to test the claim endpoint:

```bash
curl -X POST http://localhost:3000/api/airdrop/claim \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "generated_hash_from_above",
    "recipientAddress": "0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"
  }'
```

## Requirements

- Node.js 18+
- A Gnosis Chain wallet with xDai for airdrops
- Access to Gnosis Chain RPC endpoint

## License

MIT
