# Gnosis Chain wxHOPR Airdrop Service

A TypeScript-based REST API service for distributing wxHOPR tokens on Gnosis Chain through secret code validation. The service validates a secret code against configured valid codes and sends wxHOPR tokens to the recipient address if the validation succeeds.

## Features

- 🔐 **Secret Code Validation**: Validates secret codes against configured valid codes
- 💰 **Automated Airdrops**: Sends wxHOPR tokens on Gnosis Chain to valid recipients
- 🚫 **Duplicate Prevention**: Prevents multiple claims with the same secret code
- 🛡️ **Security**: Built-in validation, rate limiting, and error handling
- 📊 **Status Monitoring**: Real-time service status and balance monitoring
- 🧪 **Development Tools**: Test secret code generation for development

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

# Private key for the wallet that will send wxHOPR tokens (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Secret codes for airdrop validation (comma-separated)
SECRET_CODES=DontTellUncleSam,SecretCode123,HiddenTreasure

# Amount of wxHOPR tokens to send per successful claim (in wei, 18 decimals)
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

Claim an airdrop by providing a valid secret code and recipient address.

**Request Body:**
```json
{
  "secretCode": "DontTellUncleSam",
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
    "balance": "10.5 wxHOPR",
    "processedCount": 42
  }
}
```

### POST `/api/airdrop/generate-test-code`

Generate a test secret code for development purposes.

**Request Body:**
```json
{
  "prefix": "TestCode"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secretCode": "TestCodeabc123",
    "configuredCodes": ["DontTellUncleSam", "SecretCode123", "HiddenTreasure"]
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

## Secret Code Validation

The service uses simple string matching for secret code validation:

1. You configure a list of valid secret codes in the environment variables
2. Users provide one of these secret codes when claiming
3. The service validates the provided code against the configured valid codes
4. If valid and not already used, the service sends wxHOPR tokens to the recipient address
5. Each secret code can only be used once, regardless of the recipient address

### Example Secret Codes

```bash
# In your .env file
SECRET_CODES=DontTellUncleSam,SecretCode123,HiddenTreasure,MySpecialCode2024
```

## Security Features

- **Input Validation**: All inputs are validated for format and security
- **Duplicate Prevention**: Each secret code can only be used once
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

Generate a test secret code:

```bash
curl -X POST http://localhost:3000/api/airdrop/generate-test-code \
  -H "Content-Type: application/json" \
  -d '{"prefix": "MyTestCode"}'
```

Then use one of your configured secret codes to test the claim endpoint:

```bash
curl -X POST http://localhost:3000/api/airdrop/claim \
  -H "Content-Type: application/json" \
  -d '{
    "secretCode": "DontTellUncleSam",
    "recipientAddress": "0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"
  }'
```

## Requirements

- Node.js 18+
- A Gnosis Chain wallet with wxHOPR tokens for airdrops and xDai for gas fees
- Access to Gnosis Chain RPC endpoint

## License

MIT
# Force Railway redeploy - Thu Aug 28 17:03:01 WIB 2025
