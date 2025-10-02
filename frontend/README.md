# wxHOPR Airdrop Frontend

A modern web interface for claiming wxHOPR tokens on Gnosis Chain.

## 🚀 Quick Start

### Local Development

```bash
# Serve locally
python3 -m http.server 8080
# or
npx serve .
```

### Configuration

Update the API endpoint in `script.js`:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-api-endpoint.com/api/airdrop'
};
```

### Deployment

```bash
# Deploy to IPFS
./deploy.sh
```

## 📁 Files

- `index.html` - Main application
- `styles.css` - Styling and responsive design
- `script.js` - API integration and functionality
- `deploy.sh` - IPFS deployment script

## 📖 Complete Documentation

For comprehensive setup, API integration, and deployment guides:

**[📖 Main Documentation](../README.md)**

## 🔗 Related

- [🚀 Deployment Guide](../docs/deployment.md)
- [🔒 Security Setup](../docs/security.md)

---

This frontend connects to the CFP Funding Tool API to provide a user-friendly interface for token claims.