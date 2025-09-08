# wxHOPR Airdrop Frontend

> **📖 For complete documentation, see [`../docs/FRONTEND.md`](../docs/FRONTEND.md)**

A beautiful, modern frontend for claiming wxHOPR tokens on Gnosis Chain.

## Quick Start

1. **Configure API endpoint** in `script.js`:
   ```javascript
   const CONFIG = {
       API_BASE_URL: 'https://your-api-endpoint.com/api/airdrop'
   };
   ```

2. **Deploy to IPFS** (for ENS domains):
   ```bash
   ./deploy.sh
   ```

3. **Or serve locally**:
   ```bash
   python3 -m http.server 8080
   ```

## 📁 Files

- `index.html` - Main HTML structure
- `styles.css` - Modern CSS styling
- `script.js` - API integration and interactivity
- `deploy.sh` - IPFS deployment script

## 📖 Full Documentation

For complete setup, deployment, and customization guides:
**[📖 Frontend Documentation](../docs/FRONTEND.md)**

## 🔗 Related Documentation

- [🔌 API Documentation](../docs/API.md)
- [🚀 Deployment Guide](../docs/DEPLOYMENT.md)  
- [🔒 Security Setup](../docs/SECURITY.md)