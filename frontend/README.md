# Frontend

A modern web interface for claiming wxHOPR tokens on Gnosis Chain.

## Quick Start

```bash
# Serve locally
python3 -m http.server 8080
# or
npx serve .
```

## Configuration

Update the API endpoint in `script.js`:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-api-endpoint.com/api/airdrop'
};
```

## Deployment

```bash
# Deploy to IPFS
./deploy.sh
```

## Files

- `index.html` - Main application
- `styles.css` - Styling and responsive design  
- `script.js` - API integration and functionality
- `deploy.sh` - IPFS deployment script

---

📖 **[Complete Documentation](../README.md)** | 🚀 **[Deployment Guide](../docs/deployment.md)**