import express from 'express';
import cors from 'cors';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import multer from 'multer';
import { insertMoment, getMomentsByUsername, getAllMoments, deleteAllMoments, deleteMoment, updateMoment, getMomentDates, getMomentsRecent, getMomentsByDate } from './data/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

const isProduction = process.env.NODE_ENV === 'production' || __dirname.includes('dist');

if (isProduction) {
    app.use(express.static(join(__dirname, 'public')));
    app.use(express.static(__dirname));

    app.get('/', (_req, res) => {
        res.sendFile(join(__dirname, 'index.html'));
    });

    app.get('/suzhou', (_req, res) => {
        res.sendFile(join(__dirname, 'suzhou.html'));
    });

    app.get('/compose', (_req, res) => {
        res.sendFile(join(__dirname, 'city.html'));
    });

    app.get('/diary', (_req, res) => {
        res.sendFile(join(__dirname, 'diary.html'));
    });

    app.get(['/admin', '/admin.html'], (_req, res) => {
        res.sendFile(join(__dirname, 'admin.html'));
    });
} else {
    app.use(express.static(join(__dirname, 'public')));
    app.use(express.static(__dirname));

    app.get('/', (_req, res) => {
        res.sendFile(join(__dirname, 'index.html'));
    });

    app.get('/suzhou', (_req, res) => {
        res.sendFile(join(__dirname, 'suzhou.html'));
    });

    app.get('/compose', (_req, res) => {
        res.sendFile(join(__dirname, 'city.html'));
    });

    app.get('/diary', (_req, res) => {
        res.sendFile(join(__dirname, 'diary.html'));
    });

    app.get(['/admin', '/admin.html'], (_req, res) => {
        res.sendFile(join(__dirname, 'admin.html'));
    });
}

// ElevenLabs API endpoint
app.post('/api/generate-sound', async (req, res) => {
    try {
        const { prompt, duration } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (duration !== undefined && duration !== null) {
            if (duration < 0.5 || duration > 30) {
                return res.status(400).json({ error: 'Duration must be between 0.5 and 30 seconds' });
            }
        }

        const elevenlabs = new ElevenLabsClient();

        const audio = await elevenlabs.textToSoundEffects.convert({
            text: prompt,
            duration_seconds: duration || null,
        });

        let audioBase64;
        if (audio.arrayBuffer) {
            const audioBuffer = await audio.arrayBuffer();
            audioBase64 = Buffer.from(audioBuffer).toString('base64');
        } else if (audio.buffer) {
            audioBase64 = Buffer.from(audio.buffer).toString('base64');
        } else if (audio instanceof ArrayBuffer) {
            audioBase64 = Buffer.from(audio).toString('base64');
        } else if (audio instanceof Uint8Array) {
            audioBase64 = Buffer.from(audio).toString('base64');
        } else if (audio instanceof ReadableStream) {
            const reader = audio.getReader();
            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const combinedArray = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                combinedArray.set(chunk, offset);
                offset += chunk.length;
            }
            audioBase64 = Buffer.from(combinedArray).toString('base64');
        } else {
            throw new Error('Unsupported audio format from ElevenLabs SDK');
        }

        res.json({
            success: true,
            audio: `data:audio/mpeg;base64,${audioBase64}`,
            prompt: prompt
        });

    } catch (error) {
        console.error('ElevenLabs API error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate sound effect',
            details: error.response?.data || error.message
        });
    }
});

// Get all recordings (used by suzhou/compose page)
app.get('/api/get-recordings', (_req, res) => {
    try {
        const rows = getAllMoments();
        const recordings = rows.map(row => ({
            username: row.username,
            recordingNumber: row.slot_number,
            metadata: {
                description: row.description,
                location: row.location_lat != null
                    ? { lat: row.location_lat, lng: row.location_lng, accuracy: row.location_accuracy }
                    : null,
                locationName: row.location_name,
                timestamp: row.timestamp,
                slotNumber: row.slot_number
            },
            description: row.description,
            audioFile: row.audio_path ? row.audio_path.split('/').pop() : null,
            photoFile: row.photo_path ? row.photo_path.split('/').pop() : null
        }));
        res.json({ recordings });
    } catch (error) {
        console.error('Error getting recordings:', error);
        res.status(500).json({ error: 'Failed to get recordings', details: error.message });
    }
});

// Save recordings (multi-slot, from legacy recorder format)
app.post('/api/save-recordings', upload.any(), async (req, res) => {
    try {
        const { timestamp } = req.body;
        if (!timestamp) {
            return res.status(400).json({ error: 'Timestamp is required' });
        }

        const fs = await import('fs/promises');
        const path = await import('path');

        const username = req.body.username || 'user001';
        const city = req.body.city || null;
        const userDir = path.join(__dirname, 'public', 'users', username);
        await fs.mkdir(userDir, { recursive: true });

        const files = req.files || [];
        const recordingsByNumber = {};

        for (const file of files) {
            const match = file.fieldname.match(/^recording_(\d+)_(audio|photo)$/);
            if (match) {
                const [, slotNumber, fileType] = match;
                const slotNum = parseInt(slotNumber);
                if (!recordingsByNumber[slotNum]) recordingsByNumber[slotNum] = {};
                recordingsByNumber[slotNum][fileType] = file;
            }
        }

        for (const [key, value] of Object.entries(req.body)) {
            const match = key.match(/^recording_(\d+)_(metadata|description)$/);
            if (match) {
                const [, slotNumber, fieldType] = match;
                const slotNum = parseInt(slotNumber);
                if (!recordingsByNumber[slotNum]) recordingsByNumber[slotNum] = {};
                if (fieldType === 'metadata') {
                    try { recordingsByNumber[slotNum].metadata = JSON.parse(value); } catch {}
                } else {
                    recordingsByNumber[slotNum].description = value;
                }
            }
        }

        const savedRecordings = [];

        for (const [slotNumber, recording] of Object.entries(recordingsByNumber)) {
            if (!recording.metadata) continue;
            const slotNum = parseInt(slotNumber);
            const baseFileName = `${username}-${slotNum}`;

            let audioPath = null;
            let photoPath = null;

            if (recording.audio) {
                const relPath = `users/${username}/${baseFileName}.webm`;
                await fs.writeFile(path.join(__dirname, 'public', relPath), recording.audio.buffer);
                audioPath = relPath;
            }

            if (recording.photo) {
                const relPath = `users/${username}/${baseFileName}.jpg`;
                await fs.writeFile(path.join(__dirname, 'public', relPath), recording.photo.buffer);
                photoPath = relPath;
            }

            const meta = recording.metadata;
            insertMoment({
                id: meta.id || `${username}-${slotNum}`,
                username,
                city,
                audio_path: audioPath,
                photo_path: photoPath,
                description: recording.description || meta.description || '',
                location_lat: meta.location?.lat ?? meta.location?.latitude ?? null,
                location_lng: meta.location?.lng ?? meta.location?.longitude ?? null,
                location_accuracy: meta.location?.accuracy ?? null,
                location_name: meta.locationName || null,
                timestamp
            });

            savedRecordings.push({
                slot: slotNum,
                filename: `${baseFileName}.webm`,
                hasPhoto: !!recording.photo
            });
        }

        res.json({
            success: true,
            message: `Successfully saved ${savedRecordings.length} recordings`,
            username,
            recordings: savedRecordings
        });

    } catch (error) {
        console.error('Error saving recordings:', error);
        res.status(500).json({ error: 'Failed to save recordings', details: error.message });
    }
});

// Save a single moment (used by diary.js)
app.post('/api/moments', upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), async (req, res) => {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');

        const meta = JSON.parse(req.body.metadata || '{}');
        const username = req.body.username || 'anonymous';
        const city = req.body.city || null;
        const userDir = path.join(__dirname, 'public', 'users', username);
        await fs.mkdir(userDir, { recursive: true });

        const id = meta.id || crypto.randomUUID();
        let audioPath = null;
        let photoPath = null;

        if (req.files?.audio?.[0]) {
            const ext = req.files.audio[0].mimetype.includes('webm') ? 'webm' : 'mp4';
            const relPath = `users/${username}/${id}.${ext}`;
            await fs.writeFile(path.join(__dirname, 'public', relPath), req.files.audio[0].buffer);
            audioPath = relPath;
        }

        if (req.files?.photo?.[0]) {
            const relPath = `users/${username}/${id}.jpg`;
            await fs.writeFile(path.join(__dirname, 'public', relPath), req.files.photo[0].buffer);
            photoPath = relPath;
        }

        insertMoment({
            id,
            username,
            city,
            audio_path: audioPath,
            photo_path: photoPath,
            description: meta.text || '',
            feel: meta.feel || '',
            location_lat: meta.location?.lat ?? null,
            location_lng: meta.location?.lng ?? null,
            location_accuracy: meta.location?.accuracy ?? null,
            location_name: meta.locationName || null,
            tags: meta.tags ? JSON.stringify(meta.tags) : null,
            timestamp: meta.timestamp || new Date().toISOString()
        });

        res.json({ success: true, id, audioPath, photoPath });

    } catch (error) {
        console.error('Error saving moment:', error);
        res.status(500).json({ error: 'Failed to save moment', details: error.message });
    }
});

// Get distinct dates that have moments for a user
app.get('/api/moments/dates', (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: 'username required' });
        res.json({ dates: getMomentDates(username) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get dates', details: error.message });
    }
});

// Get moments for a user — supports ?date=YYYY-MM-DD and ?days=N
app.get('/api/moments', (req, res) => {
    try {
        const { username, date, days } = req.query;
        let rows;
        if (date)      rows = getMomentsByDate(username, date);
        else if (days) rows = getMomentsRecent(username, parseInt(days, 10));
        else           rows = username ? getMomentsByUsername(username) : getAllMoments();
        res.json({ moments: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get moments', details: error.message });
    }
});

// Delete a single moment by id
app.delete('/api/moments/:id', async (req, res) => {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const row = getAllMoments().find(r => r.id === req.params.id);
        if (row) {
            if (row.audio_path) await fs.unlink(path.join(__dirname, 'public', row.audio_path)).catch(() => {});
            if (row.photo_path) await fs.unlink(path.join(__dirname, 'public', row.photo_path)).catch(() => {});
        }
        deleteMoment(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete moment', details: error.message });
    }
});

// Update editable fields of a moment (text, feel, locationName, tags)
app.patch('/api/moments/:id', (req, res) => {
    try {
        const { description, feel, locationName, tags } = req.body;
        updateMoment(req.params.id, {
            description: description ?? '',
            feel: feel ?? '',
            locationName: locationName ?? '',
            tags: typeof tags === 'string' ? tags : JSON.stringify(tags ?? []),
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update moment', details: error.message });
    }
});

// Export all moments as CSV for city visualization
app.get('/api/moments/csv', (_req, res) => {
    try {
        const rows = getAllMoments();

        // Build sorted list of distinct dates to assign relative day numbers
        const distinctDates = [...new Set(rows.map(r => r.timestamp.slice(0, 10)))].sort();
        const dayIndex = Object.fromEntries(distinctDates.map((d, i) => [d, i + 1]));

        function escapeCSV(val) {
            const s = String(val ?? '');
            return s.includes(',') || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"` : s;
        }

        const header = 'src,bgc,audio,hear,feel,tag,user,city,location,day,time,date';
        const csvRows = rows.map(r => {
            const src  = r.photo_path ? `/${r.photo_path}` : '';
            const audio = r.audio_path ? `/${r.audio_path}` : '';
            const ts   = new Date(r.timestamp);
            const hh   = String(ts.getHours()).padStart(2, '0');
            const mm   = String(ts.getMinutes()).padStart(2, '0');
            const time = `${hh}:${mm}`;
            const month = String(ts.getMonth() + 1).padStart(2, '0');
            const day_of_month = String(ts.getDate()).padStart(2, '0');
            const date = `${month}-${day_of_month}`;
            const dateKey = r.timestamp.slice(0, 10);
            const day  = dayIndex[dateKey] ?? 1;
            let tagDisplay = '';
            try {
                const tags = r.tags ? JSON.parse(r.tags) : [];
                const first = Array.isArray(tags) && tags.length > 0 ? tags[0] : '';
                tagDisplay = first.startsWith('special') ? 'special' : first;
            } catch (_) {}
            return [src, src, audio, r.description || '', r.feel || '', tagDisplay, r.username, r.city || '', r.location_name || '', day, time, date]
                .map(escapeCSV).join(',');
        });

        res.setHeader('Content-Type', 'text/csv');
        res.send([header, ...csvRows].join('\n'));
    } catch (error) {
        res.status(500).json({ error: 'Failed to export CSV', details: error.message });
    }
});

// Clear all user data
app.post('/api/clear-all-data', async (req, res) => {
    try {
        const { confirm, environment } = req.body;

        if (!confirm || confirm !== 'CLEAR_ALL_DATA_CONFIRM') {
            return res.status(400).json({
                error: 'Confirmation required',
                message: 'Please provide confirm: "CLEAR_ALL_DATA_CONFIRM" to proceed'
            });
        }

        if (environment && environment !== 'production' && environment !== 'staging') {
            return res.status(400).json({
                error: 'Environment check failed',
                message: 'This operation is only allowed in production or staging environments'
            });
        }

        const fs = await import('fs/promises');
        const path = await import('path');

        console.log('Starting to clear all user data...');

        const usersDir = path.join(__dirname, 'public', 'users');
        let totalFilesDeleted = 0;
        let totalDirectoriesDeleted = 0;

        try {
            await fs.access(usersDir);
            const userDirs = await fs.readdir(usersDir);

            for (const userDir of userDirs) {
                if (userDir.startsWith('.')) continue;
                const userPath = path.join(usersDir, userDir);
                const userStat = await fs.stat(userPath);

                if (userStat.isDirectory()) {
                    const files = await fs.readdir(userPath);
                    for (const file of files) {
                        await fs.unlink(path.join(userPath, file));
                        totalFilesDeleted++;
                    }
                    await fs.rmdir(userPath);
                    totalDirectoriesDeleted++;
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        deleteAllMoments();
        console.log('SQLite moments table cleared');

        const summary = {
            success: true,
            message: 'All user data cleared successfully',
            timestamp: new Date().toISOString(),
            environment: environment || 'development',
            details: {
                filesDeleted: totalFilesDeleted,
                directoriesDeleted: totalDirectoriesDeleted,
                usersCleared: totalDirectoriesDeleted,
                dbCleared: true
            }
        };

        res.json(summary);

    } catch (error) {
        console.error('Error clearing user data:', error);
        res.status(500).json({
            error: 'Failed to clear user data',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Batch import of externally recorded moments (researcher tool)
app.post('/api/admin/import', upload.fields([
    { name: 'csv', maxCount: 1 },
    { name: 'files' },
]), (req, res) => {
    try {
        if (!req.files?.csv?.[0]) return res.status(400).json({ error: 'No CSV file uploaded' });

        const csvText = req.files.csv[0].buffer.toString('utf8');
        const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return res.status(400).json({ error: 'CSV has no data rows' });

        const header = lines[0].split(',').map(h => h.trim());
        const col = name => header.indexOf(name);

        const fileMap = {};
        (req.files.files || []).forEach(f => { fileMap[f.originalname] = f; });

        let inserted = 0;
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.trim());
            const get = name => { const c = col(name); return c >= 0 ? (vals[c] || '') : ''; };

            try {
                const username  = get('username');
                const tsRaw     = get('timestamp');
                const audioFile = get('audio_file');

                if (!username || !tsRaw || !audioFile) {
                    errors.push(`Row ${i}: missing username, timestamp, or audio_file`);
                    continue;
                }

                const ts = new Date(tsRaw).toISOString();
                const id = `import_${username}_${tsRaw.replace(/\D/g, '').slice(0, 12)}_${audioFile.replace(/\.[^.]+$/, '')}`;

                const userDir = join(__dirname, 'public', 'users', username);
                mkdirSync(userDir, { recursive: true });

                const audioEntry = fileMap[audioFile];
                if (!audioEntry) { errors.push(`Row ${i}: audio file '${audioFile}' not uploaded`); continue; }
                const audioExt  = audioFile.split('.').pop();
                const audioName = `${id}.${audioExt}`;
                writeFileSync(join(userDir, audioName), audioEntry.buffer);
                const audio_path = `users/${username}/${audioName}`;

                let photo_path = null;
                const photoFile = get('photo_file');
                if (photoFile && fileMap[photoFile]) {
                    const photoExt  = photoFile.split('.').pop();
                    const photoName = `${id}_photo.${photoExt}`;
                    writeFileSync(join(userDir, photoName), fileMap[photoFile].buffer);
                    photo_path = `users/${username}/${photoName}`;
                }

                const tagsRaw = get('tags');
                const tags = tagsRaw
                    ? JSON.stringify(tagsRaw.split(';').map(t => t.trim()).filter(Boolean))
                    : null;

                insertMoment({
                    id, username,
                    city:              get('city'),
                    audio_path, photo_path,
                    description:       get('description'),
                    feel:              get('feel'),
                    tags,
                    location_name:     get('location_name'),
                    location_lat:      null,
                    location_lng:      null,
                    location_accuracy: null,
                    timestamp:         ts,
                });
                inserted++;
            } catch (rowErr) {
                errors.push(`Row ${i}: ${rowErr.message}`);
            }
        }

        res.json({ inserted, errors });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Urban Sound Diary server running' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
