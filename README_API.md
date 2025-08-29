# 🎵 ElevenLabs API Integration Setup

This guide will help you set up the ElevenLabs API for generating AI sound effects in your SoniCity app.

## 🔑 Step 1: Get Your ElevenLabs API Key

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for a free account
3. Go to your profile → API Key
4. Copy your API key

## 📁 Step 2: Create Environment File

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your API key:
   ```
   ELEVENLABS_API_KEY=your_actual_api_key_here
   PORT=3001
   ```

## 📦 Step 3: Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server
- `cors` - Cross-origin resource sharing
- `axios` - HTTP client for API calls
- `dotenv` - Environment variable loader
- `concurrently` - Run multiple commands

## 🚀 Step 4: Start the Servers

### Option A: Run Both Servers (Recommended)
```bash
npm run dev:full
```

### Option B: Run Separately
Terminal 1 (Vite frontend):
```bash
npm run dev
```

Terminal 2 (Express backend):
```bash
npm run server
```

## 🌐 Step 5: Test the API

1. **Frontend**: Open `http://localhost:5173/suzhou.html`
2. **Backend**: Check `http://localhost:3001/api/health`
3. **Test AI Generation**: Type a prompt and click "Generate"

## 🔧 How It Works

### Frontend (`suzhou.html`)
- User types prompt in textarea
- Clicks "Generate" button
- Sends POST request to backend
- Creates new interactive button with AI audio

### Backend (`server.js`)
- Receives prompt from frontend
- Calls ElevenLabs API with your key
- Returns audio as base64 data
- Handles errors gracefully

### Security Features
- ✅ API key stored in `.env` (never in frontend)
- ✅ CORS enabled for local development
- ✅ Input validation
- ✅ Error handling

## 🎯 API Endpoints

- `POST /api/generate-sound` - Generate sound effect
- `GET /api/health` - Server health check

## 🐛 Troubleshooting

### "API key not configured"
- Check `.env` file exists
- Verify `ELEVENLABS_API_KEY` is set
- Restart the server

### "CORS error"
- Make sure backend is running on port 3001
- Check `cors()` middleware is enabled

### "Failed to generate sound effect"
- Check ElevenLabs API key is valid
- Verify internet connection
- Check browser console for details

## 💡 Next Steps

1. **Customize Voice Settings**: Modify `voice_settings` in `server.js`
2. **Add More Models**: Try different `model_id` values
3. **Save Generated Audio**: Store audio files locally
4. **Add Audio Controls**: Implement volume, pan, filters for AI audio

## 📚 Resources

- [ElevenLabs API Docs](https://docs.elevenlabs.io/)
- [Express.js Guide](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/)

---

**Happy Sound Generation! 🎵✨**
