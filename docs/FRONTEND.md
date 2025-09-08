# 🌐 Frontend Documentation

## Overview

The wxHOPR Airdrop Frontend is a modern, responsive web application for claiming wxHOPR tokens and xDai on Gnosis Chain. It provides a user-friendly interface for the airdrop API service.

## 🚀 Features

- **Modern UI**: Clean, responsive design with smooth animations
- **Real-time Validation**: Client-side validation for Ethereum addresses and secret codes
- **API Integration**: Connects to the backend API service
- **Transaction Tracking**: Direct links to Gnosis Chain block explorer
- **Mobile Responsive**: Optimized for all device sizes
- **Accessibility**: WCAG compliant with proper semantic HTML
- **Test Tools**: Built-in secret code generation for development

## 📁 File Structure

```
frontend/
├── index.html              # Main HTML structure
├── styles.css              # Modern CSS styling with CSS custom properties
├── script.js               # JavaScript for API integration and interactivity
├── deploy.sh               # Deployment script
└── ipfs-deploy/           # IPFS deployment artifacts
```

## 🔗 API Configuration

The frontend is configured to connect to:
```javascript
const CONFIG = {
    API_BASE_URL: 'https://airdrop-api-only-production.up.railway.app/api/airdrop',
    NETWORK: {
        name: 'Gnosis Chain',
        chainId: 100,
        blockExplorer: 'https://gnosis.blockscout.com'
    }
};
```

To change the API endpoint, modify `CONFIG.API_BASE_URL` in `script.js`.

## 🎨 Customization

### Colors and Styling

Edit CSS custom properties in `styles.css`:
```css
:root {
    --primary-color: #000050;
    --secondary-color: #0000b4;
    --accent-color: #ffd700;
    --background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --success-color: #28a745;
    --error-color: #dc3545;
    --warning-color: #ffc107;
}
```

### Branding

Update the following elements:
- Page title and meta tags in `index.html`
- Logo and branding text
- Color scheme in CSS variables
- Network configuration in `script.js`

## 🌐 Deployment Options

### Option 1: IPFS Deployment (Recommended for ENS)

Perfect for ENS domains like `funding.lizhophart.eth`:

```bash
# Using IPFS CLI
ipfs add -r frontend/

# Using the deployment script
cd frontend
./deploy.sh
```

### Option 2: Traditional Web Hosting

Upload all files to your web host:
- Ensure files are served with proper MIME types
- Configure HTTPS (required for ENS domains)
- Set up proper caching headers

### Option 3: GitHub Pages

```bash
# Create gh-pages branch with frontend files
git checkout -b gh-pages
git add frontend/*
git commit -m "Deploy frontend"
git push origin gh-pages
```

### Option 4: Vercel/Netlify

1. Connect your repository
2. Set build directory to `frontend/`
3. No build command needed (static files)
4. Deploy

## 🧪 Local Development

### Method 1: Simple HTTP Server

```bash
cd frontend

# Using Python
python3 -m http.server 8080

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8080
```

### Method 2: With Backend

```bash
# Start backend (serves frontend at root)
npm run dev

# Access at http://localhost:3000
```

## 📱 Usage Guide

### Claiming an Airdrop

1. **Enter Recipient Address**: Provide a valid Ethereum address (0x...)
2. **Enter Secret Code**: Provide your secret code
3. **Click "Claim Airdrop"**: Submit the form to claim tokens

The frontend will:
- Validate the address format
- Submit the claim to the API
- Display success/error messages
- Show transaction hashes with block explorer links

### Generating Test Codes (Development)

1. Scroll to the "Generate Test Code" section
2. Enter a prefix (optional)
3. Click "Generate" to create a test code
4. Use the generated code in the main form

### Checking Service Status

Click "Check Service Status" to view:
- Current service status
- wxHOPR and xDai balances
- Number of processed claims

## 🔒 Security Features

- **Input Validation**: Client-side validation prevents malformed requests
- **HTTPS Enforcement**: All API calls use HTTPS
- **CSP Compliance**: Content Security Policy compliant
- **No Sensitive Data Storage**: No private keys or sensitive data stored locally

## 🎯 Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features Used**: ES6+, Fetch API, CSS Grid, CSS Custom Properties

## 🔧 Configuration Options

### Environment-Specific Settings

For different environments, update `script.js`:

```javascript
const CONFIG = {
    // Development
    API_BASE_URL: 'http://localhost:3000/api/airdrop',
    
    // Staging
    API_BASE_URL: 'https://staging-api.example.com/api/airdrop',
    
    // Production
    API_BASE_URL: 'https://api.example.com/api/airdrop'
};
```

### Network Configuration

To support different networks:

```javascript
NETWORK: {
    name: 'Gnosis Chain',
    chainId: 100,
    blockExplorer: 'https://gnosis.blockscout.com',
    rpcUrl: 'https://rpc.gnosischain.com'
}
```

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure the backend allows your domain in CORS settings
- Check that API_BASE_URL is correct

**API Connection Failed:**
- Verify the backend service is running
- Check network connectivity
- Verify API endpoint URLs

**Address Validation Errors:**
- Ensure addresses start with "0x"
- Verify address is exactly 42 characters
- Check for valid hexadecimal characters

**Mobile Display Issues:**
- Clear browser cache
- Check viewport meta tag
- Verify CSS media queries

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## 📊 Analytics and Monitoring

### Adding Analytics

To add Google Analytics or similar:

```html
<!-- Add to index.html head -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Performance Monitoring

Monitor key metrics:
- Page load time
- API response time
- Error rates
- User interactions

## 🔄 Updates and Maintenance

### Updating API Endpoints

1. Update `CONFIG.API_BASE_URL` in `script.js`
2. Test all functionality
3. Redeploy frontend

### Adding New Features

1. Update HTML structure if needed
2. Add CSS styling
3. Implement JavaScript functionality
4. Test across browsers
5. Update documentation

---

For backend API documentation, see [`API.md`](API.md).
For deployment guides, see [`DEPLOYMENT.md`](DEPLOYMENT.md).
