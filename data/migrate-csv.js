// One-time migration: node data/migrate-csv.js
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { insertMoment } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const csv = readFileSync(join(root, 'imagedata-suzhou.csv'), 'utf8');
const lines = csv.trim().split('\n').slice(1); // skip header

let inserted = 0;
for (const line of lines) {
  // username is always the last field; audio is always 3rd field (index 2)
  const parts = line.split(',');
  const username = parts[parts.length - 1];
  const src = parts[0];
  const audio = parts[2];
  const description = parts.slice(3, parts.length - 1).join(',');
  if (!audio || !audio.trim()) continue;

  // Derive JSON path: users/kenny/kenny-1.webm → public/users/kenny/kenny-1.json
  const jsonPath = join(root, 'public', audio.trim().replace('.webm', '.json'));
  let timestamp = new Date('2025-08-30').toISOString(); // fallback
  let location_lat = null, location_lng = null, location_accuracy = null;

  if (existsSync(jsonPath)) {
    const meta = JSON.parse(readFileSync(jsonPath, 'utf8'));
    if (meta.timestamp) timestamp = meta.timestamp;
    if (meta.location) {
      // Old JSON uses latitude/longitude; Moment.js uses lat/lng
      location_lat = meta.location.latitude ?? meta.location.lat ?? null;
      location_lng = meta.location.longitude ?? meta.location.lng ?? null;
      location_accuracy = meta.location.accuracy ?? null;
    }
  }

  insertMoment({
    id: crypto.randomUUID(),
    username: username.trim(),
    city: 'Suzhou',
    audio_path: audio.trim(),
    photo_path: src.trim() || null,
    description: description.trim(),
    location_lat,
    location_lng,
    location_accuracy,
    location_name: null,
    timestamp,
  });
  inserted++;
  console.log(`  [${inserted}] ${username.trim()} — ${description.trim() || '(no description)'}`);
}

console.log(`\nDone. Migrated ${inserted} moments from CSV into SQLite.`);
