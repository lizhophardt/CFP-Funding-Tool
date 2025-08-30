# wxHOPR Airdrop Frontend

A beautiful, modern frontend for claiming wxHOPR tokens on Gnosis Chain.

## 🚀 Features

- **Modern UI**: Clean, responsive design with smooth animations
- **API Integration**: Connects to Railway-hosted API backend
- **Real-time Validation**: Form validation with helpful error messages
- **Transaction Tracking**: Direct links to Gnosis Chain block explorer
- **Mobile Responsive**: Optimized for all device sizes
- **Accessibility**: WCAG compliant with proper semantic HTML

## 📁 Files

- `index.html` - Main HTML structure
- `styles.css` - Modern CSS styling with CSS custom properties
- `script.js` - JavaScript for API integration and interactivity
- `README.md` - This documentation

## 🔗 API Configuration

The frontend is configured to connect to:
```
https://airdrop-api-only-production.up.railway.app/api/airdrop
```

## 🌐 Deployment

### For ENS Domain (funding.lizhophart.eth)

1. **IPFS Deployment** (Recommended for ENS):
   ```bash
   # Install IPFS CLI or use web interface
   ipfs add -r frontend/
   # Set ENS content hash to IPFS hash
   ```

2. **Traditional Web Hosting**:
   - Upload all files to your web host
   - Ensure files are served with proper MIME types
   - Configure HTTPS (required for ENS domains)

3. **GitHub Pages**:
   ```bash
   # Create gh-pages branch with frontend files
   git checkout -b gh-pages
   git add frontend/*
   git commit -m "Deploy frontend"
   git push origin gh-pages
   ```

### Local Development

```bash
# Start local server
cd frontend
python3 -m http.server 8080

# Or use Node.js
npx serve .

# Or use PHP
php -S localhost:8080
```

Visit: `http://localhost:8080`

## 🔧 Configuration

To change the API endpoint, modify the `CONFIG.API_BASE_URL` in `script.js`:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-api-domain.com/api/airdrop',
    // ... other config
};
```

## 🎨 Customization

### Colors
Edit CSS custom properties in `styles.css`:
```css
:root {
    --primary-color: #000050;
    --secondary-color: #0000b4;
    --accent-color: #3c64a5;
    --background-color: #ffffa0;
}
```

### Network Configuration
Update network settings in `script.js`:
```javascript
NETWORK: {
    name: 'Gnosis Chain',
    chainId: 100,
    blockExplorer: 'https://gnosis.blockscout.com'
}
```

## 🧪 Testing

1. **Form Validation**: Try submitting with invalid addresses/hashes
2. **API Connection**: Check browser console for API health status
3. **Responsive Design**: Test on different screen sizes
4. **Accessibility**: Use screen reader or accessibility tools

## 🔒 Security

- All API calls use HTTPS
- Input validation on both client and server
- No sensitive data stored in frontend
- CORS properly configured on API

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🐛 Troubleshooting

### API Connection Issues
- Check browser console for errors
- Verify API endpoint is accessible
- Ensure CORS is configured properly

### Styling Issues
- Verify CSS files are loading
- Check for font/icon CDN availability
- Test in different browsers

### Form Submission Issues
- Check network tab for API requests
- Verify form validation logic
- Test with valid test data
