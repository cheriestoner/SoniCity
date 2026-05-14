import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

mkdirSync(__dirname, { recursive: true });

const db = new Database(join(__dirname, 'sonicity.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS moments (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    city TEXT,
    audio_path TEXT,
    photo_path TEXT,
    description TEXT,
    location_lat REAL,
    location_lng REAL,
    location_accuracy REAL,
    location_name TEXT,
    feel TEXT,
    tags TEXT,
    timestamp TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migrate existing DBs that don't yet have the feel column
try { db.exec(`ALTER TABLE moments ADD COLUMN feel TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE moments ADD COLUMN tags TEXT`); } catch (_) {}

export function insertMoment(row) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO moments
      (id, username, city, audio_path, photo_path, description,
       location_lat, location_lng, location_accuracy, location_name, feel, tags, timestamp)
    VALUES
      (@id, @username, @city, @audio_path, @photo_path, @description,
       @location_lat, @location_lng, @location_accuracy, @location_name, @feel, @tags, @timestamp)
  `);
  return stmt.run(row);
}

export function getMomentsByUsername(username) {
  return db.prepare('SELECT * FROM moments WHERE username = ? ORDER BY timestamp DESC').all(username);
}

export function getMomentDates(username) {
  return db.prepare(
    'SELECT DISTINCT date(timestamp) AS date FROM moments WHERE username = ? ORDER BY date DESC'
  ).all(username).map(r => r.date);
}

export function getMomentsRecent(username, days) {
  return db.prepare(
    `SELECT * FROM moments WHERE username = ? AND date(timestamp) >= date('now', ?) ORDER BY timestamp DESC`
  ).all(username, `-${days - 1} days`);
}

export function getMomentsByDate(username, date) {
  return db.prepare(
    'SELECT * FROM moments WHERE username = ? AND date(timestamp) = ? ORDER BY timestamp DESC'
  ).all(username, date);
}

export function getAllMoments() {
  return db.prepare('SELECT * FROM moments ORDER BY timestamp DESC').all();
}

export function deleteAllMoments() {
  return db.prepare('DELETE FROM moments').run();
}

export default db;
