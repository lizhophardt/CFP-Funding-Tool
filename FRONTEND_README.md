# Chiado wxHOPR Airdrop Frontend

A modern, responsive web frontend for claiming Chiado wxHOPR airdrops.

## Features

- **Modern UI**: Clean, responsive design with gradient backgrounds and smooth animations
- **Form Validation**: Client-side validation for Ethereum addresses and hash inputs
- **Real-time Feedback**: Loading states, success/error messages, and result display
- **Test Hash Generation**: Built-in tool to generate test hashes for development
- **Service Status**: Check the backend service status and balance
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Setup

1. **Start the Backend Server**
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3000`

2. **Access the Frontend**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   The frontend is served as a static file from the `/public` directory.

## Usage

### Claiming an Airdrop

1. **Enter Recipient Address**: Provide a valid Ethereum address (0x...)
2. **Enter Hash**: Provide the hash for your airdrop claim
3. **Click "Claim Airdrop"**: Submit the form to claim your tokens

### Generating Test Hashes

For development and testing:

1. Scroll down to the "Generate Test Hash" section
2. Enter any preimage text
3. Click "Generate" to create a hash
4. The generated hash will automatically fill the main form

### Checking Service Status

Click the "Check Service Status" button to view:
- Current service status
- Account balance
- Network information

## API Endpoints Used

The frontend communicates with these backend endpoints:

- `POST /api/airdrop/claim` - Claim an airdrop
- `GET /api/airdrop/status` - Get service status
- `POST /api/airdrop/generate-test-hash` - Generate test hash
- `GET /api/airdrop/health` - Health check

## Configuration

### API Base URL

By default, the frontend connects to `http://localhost:3000/api/airdrop`. 

To change this, edit the `API_BASE` constant in the JavaScript section of `/public/index.html`:

```javascript
const API_BASE = 'http://your-server:port/api/airdrop';
```

### CORS Configuration

The backend is already configured to accept requests from the frontend. The CORS settings in `src/app.ts` allow all origins in development mode.

## File Structure

```
public/
└── index.html          # Complete frontend application (HTML + CSS + JS)

src/
├── app.ts             # Backend server with static file serving
└── ...                # Other backend files
```

## Styling

The frontend uses:
- **CSS3**: Modern styling with flexbox, gradients, and animations
- **Font Awesome**: Icons for better UX
- **Responsive Design**: Mobile-first approach with media queries

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

The frontend is a single HTML file with embedded CSS and JavaScript. To modify:

1. Edit `/public/index.html`
2. Refresh your browser to see changes
3. No build process required

## Security Notes

- Client-side validation is implemented but server-side validation is the primary security measure
- All API calls use proper error handling
- Input sanitization is handled by the backend

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend CORS configuration allows your frontend origin
2. **Network Errors**: Check that the backend server is running on the correct port
3. **Invalid Address**: Ensure Ethereum addresses start with "0x" and are 42 characters long

### Debug Mode

Open browser developer tools (F12) to view console logs and network requests for debugging.
