#!/bin/bash

# SoniCity MPA Deployment Script
# Builds the Multi-Page Application and prepares for deployment

set -e

echo "🚀 SoniCity MPA Deployment Script"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Build the application
echo -e "\n${BLUE}Step 1: Building the application...${NC}"
npm run build

# Step 2: Check what was built
echo -e "\n${BLUE}Step 2: Checking build output...${NC}"
echo "Built files in dist/:"
ls -la dist/

# Step 3: Copy server files to dist
echo -e "\n${BLUE}Step 3: Preparing for production...${NC}"
cp server.js dist/
cp package.json dist/
cp .env dist/ 2>/dev/null || echo "⚠️  .env file not found (create one with your API keys)"

# Step 4: Create production start script
cat > dist/start.sh << 'EOF'
#!/bin/bash
echo "🎵 Starting SoniCity Production Server..."
npm install --production
node server.js
EOF

chmod +x dist/start.sh

# Step 5: Create deployment instructions
cat > dist/DEPLOYMENT.md << 'EOF'
# SoniCity MPA Deployment

## Files to upload to your server:
- All files in this dist/ folder

## On your server:
1. Upload all files to your server directory
2. Run: `chmod +x start.sh`
3. Run: `./start.sh`

## Environment Variables:
Create a .env file with:
- ELEVENLABS_API_KEY=your_api_key_here
- PORT=3001 (or your preferred port)

## Access URLs:
- Home: http://your-domain.com/
- Compose: http://your-domain.com/compose
- Record: http://your-domain.com/record
EOF

echo -e "\n${GREEN}🎉 Build complete!${NC}"
echo -e "${YELLOW}Your MPA is ready in the dist/ folder${NC}"
echo -e "${BLUE}Upload the entire dist/ folder to your server${NC}"
echo -e "${BLUE}See dist/DEPLOYMENT.md for detailed instructions${NC}"
