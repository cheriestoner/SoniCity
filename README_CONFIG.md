# Configuration Guide

## Environment Variables

### Development
Copy `.env.example` to `.env` and configure:

```bash
# API Base URL for Vite proxy
API_BASE_URL=http://localhost:3001

# Server Configuration
PORT=3001

# ElevenLabs API Key (if needed)
ELEVENLABS_API_KEY=your_api_key_here
```

### Production
For production deployment, set:

```bash
# Production API URL
API_BASE_URL=https://your-domain.com
# or
API_BASE_URL=https://api.your-domain.com

# Server port (optional, defaults to 3001)
PORT=3001
```

## How It Works

1. **Vite Development Server** (port 5173):
   - Proxies `/api/*` requests to `API_BASE_URL`
   - Proxies `/compose` and `/record` routes to `API_BASE_URL`

2. **Backend Server** (port 3001 by default):
   - Handles API requests
   - Serves static files
   - Manages file uploads and storage

## Benefits of This Approach

✅ **No hardcoded URLs** - Uses environment variables  
✅ **Environment-specific configuration** - Different URLs for dev/prod  
✅ **Easy deployment** - Just change one environment variable  
✅ **Flexible proxy** - Vite handles all the routing  

## Usage Examples

### Local Development
```bash
# Start backend server
node server.js

# Start frontend dev server (in another terminal)
npm run dev
```

### Production
```bash
# Set production API URL
export API_BASE_URL=https://your-api-server.com

# Build and serve
npm run build
npm run preview
```
