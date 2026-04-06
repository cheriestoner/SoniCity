# ElevenLabs API Setup

Used by the `/compose` page to generate AI sound effects.

## 1. Get your API key

1. Go to [elevenlabs.io](https://elevenlabs.io/) and sign up
2. Profile → API Key → Copy

## 2. Configure environment

```bash
cp env.example .env
```

Edit `.env`:
```
ELEVENLABS_API_KEY=your_api_key_here
PORT=3001
```

For production, also set:
```
API_BASE_URL=https://your-backend-url.com
```

## 3. Install and run

```bash
npm install

# Terminal 1 — backend
npm run server

# Terminal 2 — frontend (dev only)
npm run dev
```

## How it works

- Frontend (`suzhou.html`) sends a prompt to `POST /api/generate-sound`
- `server.js` calls the ElevenLabs SDK with your key (never exposed to the browser)
- Audio is returned as base64 and played in the UI

## Endpoints

- `POST /api/generate-sound` — generate a sound effect from a text prompt
- `GET /api/health` — server health check

## Troubleshooting

**"API key not configured"** — check `.env` exists and `ELEVENLABS_API_KEY` is set, then restart the server.

**"Failed to generate sound effect"** — verify the API key is valid and the server is running.
