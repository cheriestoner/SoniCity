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

2. **Native module rebuild (if needed)**
   `better-sqlite3` ships a prebuilt binary tied to a specific Node.js version. If `npm run server` fails with an error like:
   ```
   Error: ... was compiled against a different Node.js version using NODE_MODULE_VERSION X.
   This version of Node.js requires NODE_MODULE_VERSION Y.
   ```
   rebuild it against your local Node version:
   ```bash
   npm rebuild better-sqlite3
   ```

## Shared Data (Google Drive)

The SQLite database and user-submitted recordings/photos are **not** in git (see `.gitignore`) — they're shared via Google Drive. After cloning, copy them in before running the app:

1. **Database** — copy `sonicity.db` `sonicity.db-shm`  `sonicity.db-wal` from Drive into:
   ```
   data
   ```

2. **User uploads** — copy the entire `users` folder from Drive into:
   ```
   public/users/
   ```

Both paths are relative to the project root. If either is missing, the app will still start, but moments/recordings/photos tied to that data won't show up.

## Running the Application

**Backend only** (serves the static frontend + API from a single server, no hot reload):
```bash
npm run server
```
Visit `http://localhost:3001`

**Full dev mode** (Vite hot reload for the frontend, proxied to the backend API — run in two terminals):
```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend
npm run dev
```
Visit `http://localhost:5173`

**Production Build:**
```bash
npm run build
NODE_ENV=production node server.js
```
