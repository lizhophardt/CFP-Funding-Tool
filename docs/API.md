# 🔌 API Documentation

## Overview

The wxHOPR Airdrop Service provides a RESTful API for claiming dual airdrops (wxHOPR tokens + xDai) on Gnosis Chain through secret code validation.

## 🌐 Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://airdrop-api-only-production.up.railway.app`

## 📋 Authentication

No authentication required for public endpoints. All endpoints use secret code validation for security.

## 🔗 Endpoints

### Core Airdrop Endpoints

#### POST `/api/airdrop/claim`

Claim a dual airdrop (wxHOPR + xDai) using a valid secret code.

**Request Body:**
```json
{
  "secretCode": "DontTellUncleSam",
  "recipientAddress": "0x742d35Cc6634C0532925a3b8D8B9B3a8d8b8B3a8"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Dual airdrop sent successfully (wxHOPR + xDai)",
  "wxHOPRTransactionHash": "0x123...abc",
  "xDaiTransactionHash": "0x456...def",
  "wxHOPRAmount": "10000000000000000",
  "xDaiAmount": "10000000000000000"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid secret code",
  "code": "VALIDATION_ERROR"
}
```

**Status Codes:**
- `200`: Successful airdrop
- `400`: Invalid request or secret code
- `403`: IP blocked due to security violations
- `429`: Rate limit exceeded
- `500`: Internal server error

---

#### GET `/api/airdrop/status`

Get current service status and balance information.

**Response:**
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "accountAddress": "0x123...abc",
    "balance": "1000.5 wxHOPR",
    "xDaiBalance": "50.25 xDai",
    "processedCount": 42
  }
}
```

---

#### GET `/api/airdrop/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "success": true,
  "message": "Airdrop service is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

#### POST `/api/airdrop/generate-test-code`

Generate a test secret code for development purposes.

**Request Body:**
```json
{
  "prefix": "TestCode"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secretCode": "TestCode_abc123",
    "configuredCodes": ["DontTellUncleSam", "SecretCode123"]
  }
}
```

### Security Endpoints

#### GET `/api/security/dashboard`

Real-time security monitoring dashboard (HTML response).

**Response:** HTML page with security metrics and monitoring information.

---

#### GET `/api/security/stats`

Security statistics and metrics in JSON format.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 1000,
    "blockedIPs": 5,
    "threatEvents": 12,
    "validationFailures": 23,
    "uptime": "5 days, 2 hours"
  }
}
```

---

#### GET `/api/security/threats`

Threat response and blocked IP information.

**Response:**
```json
{
  "success": true,
  "data": {
    "blockedIPs": ["192.168.1.100", "10.0.0.50"],
    "threatLevels": {
      "HIGH": 2,
      "MEDIUM": 8,
      "LOW": 15
    },
    "autoBlocking": true
  }
}
```

### Root Endpoint

#### GET `/`

Service information and available endpoints.

**Response:**
```json
{
  "success": true,
  "message": "Chiado wxHOPR + xDai Dual Airdrop API Service",
  "version": "2.1.0",
  "type": "API_ONLY",
  "airdropInfo": {
    "wxHoprAmount": "0.01 wxHOPR",
    "xDaiAmount": "0.01 xDai",
    "description": "Recipients get both wxHOPR tokens and native xDai"
  },
  "endpoints": {
    "POST /api/airdrop/claim": "Claim dual airdrop",
    "GET /api/airdrop/status": "Get service status",
    "POST /api/airdrop/generate-test-code": "Generate test code",
    "GET /api/airdrop/health": "Health check"
  },
  "security": {
    "rateLimiting": "Enabled",
    "cors": "Restricted to trusted origins",
    "threatResponse": "Automated IP blocking enabled"
  }
}
```

## 🔒 Security Features

### Input Validation

All requests undergo multi-layer validation:

1. **Schema Validation**: Joi-based type and format checking
2. **Security Scanning**: Detection of malicious patterns
3. **Address Validation**: Ethereum address format verification
4. **Sanitization**: Input cleaning and normalization

### Rate Limiting

- **Global**: 100 requests per 15 minutes per IP
- **Claim Endpoint**: 5 requests per 15 minutes per IP
- **Headers**: Rate limit info in response headers

### Threat Protection

- **Automatic IP Blocking**: IPs with repeated violations
- **Pattern Detection**: XSS, SQL injection, command injection
- **Security Logging**: All threats logged for analysis

### CORS Policy

**Development:**
- `http://localhost:3000`
- `http://localhost:8000`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:8000`

**Production:**
- `https://funding.lizhophart.eth`
- `https://funding.lizhophardt.eth.limo`
- IPFS gateways for ENS domains

## 📊 Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": ["Detailed validation errors"]  // Optional
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `IP_AUTO_BLOCKED` | IP blocked due to security violations |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INSUFFICIENT_BALANCE` | Not enough tokens for airdrop |
| `NETWORK_ERROR` | Blockchain connection issues |
| `TRANSACTION_FAILED` | Blockchain transaction failed |
| `INTERNAL_ERROR` | Server error |

## 🧪 Testing

### Using cURL

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

**Generate Test Code:**
```bash
curl -X POST http://localhost:3000/api/airdrop/generate-test-code \
  -H "Content-Type: application/json" \
  -d '{"prefix": "MyTest"}'
```

### Using JavaScript/Fetch

```javascript
// Claim airdrop
const claimAirdrop = async (secretCode, recipientAddress) => {
  const response = await fetch('/api/airdrop/claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secretCode,
      recipientAddress
    })
  });
  
  return await response.json();
};

// Check status
const getStatus = async () => {
  const response = await fetch('/api/airdrop/status');
  return await response.json();
};
```

## 📈 Monitoring

### Health Checks

Regular health checks should target:
- `GET /api/airdrop/health` - Basic service health
- `GET /api/airdrop/status` - Service functionality
- `GET /` - Overall service information

### Metrics to Monitor

- **Response Times**: Average API response time
- **Error Rates**: 4xx/5xx error percentages  
- **Airdrop Success Rate**: Successful vs failed claims
- **Security Events**: Blocked IPs and threat detections
- **Balance Monitoring**: wxHOPR and xDai balances

### Log Analysis

Important log patterns to monitor:
```bash
# Successful airdrops
grep "AIRDROP: Airdrop successful" logs/combined-*.log

# Security threats
grep "SECURITY:" logs/security-*.log

# Rate limit violations
grep "Rate limit exceeded" logs/combined-*.log

# Validation failures
grep "VALIDATION:" logs/combined-*.log
```

## 🔄 Versioning

API versioning follows semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes

Current version: `2.1.0`

## 📞 Support

For API issues:
1. Check the logs: `logs/combined-*.log`
2. Verify configuration: Environment variables
3. Test connectivity: Health endpoints
4. Review security logs: `logs/security-*.log`

---

For frontend integration, see [`FRONTEND.md`](FRONTEND.md).
For deployment guides, see [`DEPLOYMENT.md`](DEPLOYMENT.md).
