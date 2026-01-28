# SoniCity

Interactive soundscape application for exploring and composing urban sounds.

## Project Structure

- **public/**: Static assets (icons, images, user uploads)
- **src/**: Source code (styles, scripts)
- **server.js**: Express backend server handling API requests and file serving
- **index.html**: Main entry point

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory (see `env.example`):
   ```env
   ELEVENLABS_API_KEY=your_key_here
   PORT=3001
   ```

## Running the Application

**Development Mode:**
```bash
npm run server
```
Visit `http://localhost:3001`

**Production Build:**
```bash
npm run build
NODE_ENV=production node server.js
```
