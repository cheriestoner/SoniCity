import express from 'express';
import cors from 'cors';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Check if we're in production (dist folder exists)
const isProduction = process.env.NODE_ENV === 'production' || __dirname.includes('dist');

// Serve static files from appropriate directory
if (isProduction) {
    // Production: serve from dist folder
    app.use(express.static('public'));
    app.use(express.static('.'));
    
    // Route for root path - serve index.html from dist
    app.get('/', (req, res) => {
        res.sendFile('index.html', { root: './' });
    });
    
    // Route for suzhou page
    app.get('/compose', (req, res) => {
        res.sendFile('suzhou.html', { root: './' });
    });
    
    // Route for recorder page
    app.get('/record', (req, res) => {
        res.sendFile('recorder.html', { root: './' });
    });
} else {
    // Development: serve from project root
    app.use(express.static('public'));
    
    // Route for root path - serve index.html directly
    app.get('/', (req, res) => {
        res.sendFile('index.html', { root: './' });
    });
    
    // Route for suzhou page
    app.get('/compose', (req, res) => {
        res.sendFile('suzhou.html', { root: './' });
    });
    
    // Route for recorder page
    app.get('/record', (req, res) => {
        res.sendFile('recorder.html', { root: './' });
    });
}

// ElevenLabs API endpoint
app.post('/api/generate-sound', async (req, res) => {
    try {
        const { prompt, duration } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        // Validate duration if provided
        if (duration !== undefined && duration !== null) {
            if (duration < 0.5 || duration > 30) {
                return res.status(400).json({ error: 'Duration must be between 0.5 and 30 seconds' });
            }
        }

        // API key is automatically read from ELEVENLABS_API_KEY env var by the SDK
        
        // Initialize ElevenLabs client (API key is read from ELEVENLABS_API_KEY env var)
        const elevenlabs = new ElevenLabsClient();
        
        // Generate sound effect using the official SDK
        const audio = await elevenlabs.textToSoundEffects.convert({
            text: prompt,
            duration_seconds: duration || null, // Use provided duration or null for auto
        });
        
        // Convert audio to base64 for frontend
        // The SDK returns different types depending on the model
        let audioBase64;
        if (audio.arrayBuffer) {
            // If it has arrayBuffer method, use it
            const audioBuffer = await audio.arrayBuffer();
            audioBase64 = Buffer.from(audioBuffer).toString('base64');
        } else if (audio.buffer) {
            // If it has buffer property
            audioBase64 = Buffer.from(audio.buffer).toString('base64');
        } else if (audio instanceof ArrayBuffer) {
            // If it's already an ArrayBuffer
            audioBase64 = Buffer.from(audio).toString('base64');
        } else if (audio instanceof Uint8Array) {
            // If it's a Uint8Array
            audioBase64 = Buffer.from(audio).toString('base64');
        } else if (audio instanceof ReadableStream) {
            // Handle ReadableStream (modern streaming format)
            console.log('Converting ReadableStream to base64...');
            const reader = audio.getReader();
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            
            // Combine all chunks into a single Uint8Array
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const combinedArray = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const chunk of chunks) {
                combinedArray.set(chunk, offset);
                offset += chunk.length;
            }
            
            audioBase64 = Buffer.from(combinedArray).toString('base64');
            console.log('Successfully converted ReadableStream to base64');
        } else {
            // Fallback: log the object for debugging
            console.log('Audio object type:', typeof audio, audio);
            console.log('Audio object constructor:', audio.constructor.name);
            console.log('Audio object prototype chain:', Object.getPrototypeOf(audio));
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

// Get saved recordings endpoint
app.get('/api/get-recordings', async (req, res) => {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const usersDir = path.join(__dirname, 'public', 'users');
        
        try {
            await fs.access(usersDir);
        } catch {
            // If users directory doesn't exist, return empty array
            return res.json({ recordings: [] });
        }

        // Get all user directories
        const userDirs = await fs.readdir(usersDir);
        const allRecordings = [];

        for (const userDir of userDirs) {
            const userPath = path.join(usersDir, userDir);
            const userStat = await fs.stat(userPath);
            
            if (userStat.isDirectory()) {
                try {
                    // Get all files in user directory
                    const files = await fs.readdir(userPath);
                    
                    // Group files by recording number
                    const recordingsByNumber = {};
                    
                    for (const file of files) {
                        if (file.endsWith('.json')) {
                            // This is a metadata file
                            const match = file.match(/^(.+)-(\d+)\.json$/);
                            if (match) {
                                const [, username, number] = match;
                                const recordingNumber = parseInt(number);
                                
                                if (!recordingsByNumber[recordingNumber]) {
                                    recordingsByNumber[recordingNumber] = {};
                                }
                                
                                // Read metadata
                                try {
                                    const metadataPath = path.join(userPath, file);
                                    const metadataContent = await fs.readFile(metadataPath, 'utf8');
                                    const metadata = JSON.parse(metadataContent);
                                    
                                    recordingsByNumber[recordingNumber].metadata = metadata;
                                    recordingsByNumber[recordingNumber].description = metadata.description || '';
                                } catch (error) {
                                    console.warn(`Error reading metadata file ${file}:`, error);
                                }
                            }
                        } else if (file.endsWith('.webm') || file.endsWith('.mp3') || file.endsWith('.wav')) {
                            // This is an audio file
                            const match = file.match(/^(.+)-(\d+)\.(webm|mp3|wav)$/);
                            if (match) {
                                const [, username, number] = match;
                                const recordingNumber = parseInt(number);
                                
                                if (!recordingsByNumber[recordingNumber]) {
                                    recordingsByNumber[recordingNumber] = {};
                                }
                                
                                recordingsByNumber[recordingNumber].audioFile = file;
                            }
                        } else if (file.endsWith('.jpg') || file.endsWith('.png')) {
                            // This is a photo file
                            const match = file.match(/^(.+)-(\d+)\.(jpg|png)$/);
                            if (match) {
                                const [, username, number] = match;
                                const recordingNumber = parseInt(number);
                                
                                if (!recordingsByNumber[recordingNumber]) {
                                    recordingsByNumber[recordingNumber] = {};
                                }
                                
                                recordingsByNumber[recordingNumber].photoFile = file;
                            }
                        }
                    }
                    
                    // Convert to array format
                    for (const [number, recording] of Object.entries(recordingsByNumber)) {
                        if (recording.metadata) {
                            allRecordings.push({
                                username: userDir,
                                recordingNumber: parseInt(number),
                                metadata: recording.metadata,
                                description: recording.description,
                                audioFile: recording.audioFile,
                                photoFile: recording.photoFile
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`Error reading user directory ${userDir}:`, error);
                }
            }
        }

        res.json({ recordings: allRecordings });

    } catch (error) {
        console.error('Error getting recordings:', error);
        res.status(500).json({ 
            error: 'Failed to get recordings',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'ElevenLabs proxy server running' });
});

// Save recordings endpoint with file upload support
app.post('/api/save-recordings', upload.any(), async (req, res) => {
    try {
        const { timestamp } = req.body;
        
        console.log('Received save-recordings request')
        console.log('Timestamp:', timestamp)
        console.log('Files received:', req.files ? req.files.length : 0)
        if (req.files) {
            req.files.forEach((file, index) => {
                console.log(`File ${index}:`, {
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype
                })
            })
        }
        
        if (!timestamp) {
            return res.status(400).json({ error: 'Timestamp is required' });
        }

        // Create users directory if it doesn't exist
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const usersDir = path.join(__dirname, 'public', 'users');
        try {
            await fs.access(usersDir);
        } catch {
            await fs.mkdir(usersDir, { recursive: true });
        }

        // Use dummy username for now
        const username = 'user001';
        const userDir = path.join(usersDir, username);
        try {
            await fs.access(userDir);
        } catch {
            await fs.mkdir(userDir, { recursive: true });
        }

        // Parse uploaded files and metadata
        const files = req.files || [];
        const savedRecordings = [];
        
        // Group files by recording number
        const recordingsByNumber = {};
        
        // Process files (audio, photo)
        for (const file of files) {
            const match = file.fieldname.match(/^recording_(\d+)_(audio|photo)$/);
            if (match) {
                const [, slotNumber, fileType] = match;
                const slotNum = parseInt(slotNumber);
                
                if (!recordingsByNumber[slotNum]) {
                    recordingsByNumber[slotNum] = {};
                }
                
                if (fileType === 'audio') {
                    recordingsByNumber[slotNum].audio = file;
                } else if (fileType === 'photo') {
                    recordingsByNumber[slotNum].photo = file;
                }
            }
        }
        
        // Process form fields (metadata, description)
        console.log('Form body fields:', Object.keys(req.body));
        for (const [key, value] of Object.entries(req.body)) {
            const match = key.match(/^recording_(\d+)_(metadata|description)$/);
            if (match) {
                const [, slotNumber, fieldType] = match;
                const slotNum = parseInt(slotNumber);
                
                console.log(`Processing form field: ${key} for slot ${slotNum}`);
                
                if (!recordingsByNumber[slotNum]) {
                    recordingsByNumber[slotNum] = {};
                }
                
                if (fieldType === 'metadata') {
                    try {
                        recordingsByNumber[slotNum].metadata = JSON.parse(value);
                        console.log(`Metadata parsed for slot ${slotNum}:`, recordingsByNumber[slotNum].metadata);
                    } catch (error) {
                        console.warn(`Invalid JSON in metadata for slot ${slotNum}:`, error);
                    }
                } else if (fieldType === 'description') {
                    recordingsByNumber[slotNum].description = value;
                    console.log(`Description for slot ${slotNum}:`, value);
                }
            }
        }
        
        console.log('Grouped recordings:', recordingsByNumber);
        
        // Save each recording
        for (const [slotNumber, recording] of Object.entries(recordingsByNumber)) {
            const slotNum = parseInt(slotNumber);
            const baseFileName = `${username}-${slotNum}`;
            
            // Save metadata
            if (recording.metadata) {
                const metadataWithDescription = {
                    ...recording.metadata,
                    description: recording.description || '',
                    slotNumber: slotNum,
                    timestamp: timestamp
                };
                
                const metadataPath = path.join(userDir, `${baseFileName}.json`);
                await fs.writeFile(metadataPath, JSON.stringify(metadataWithDescription, null, 2));
                
                // Save audio file
                if (recording.audio) {
                    const audioPath = path.join(userDir, `${baseFileName}.webm`);
                    await fs.writeFile(audioPath, recording.audio.buffer);
                }
                
                // Save photo file
                if (recording.photo) {
                    const photoPath = path.join(userDir, `${baseFileName}.jpg`);
                    await fs.writeFile(photoPath, recording.photo.buffer);
                }
                
                savedRecordings.push({
                    slot: slotNum,
                    filename: `${baseFileName}.webm`,
                    metadata: metadataWithDescription,
                    description: recording.description,
                    hasPhoto: !!recording.photo
                });
            }
        }

        res.json({
            success: true,
            message: `Successfully saved ${savedRecordings.length} recordings`,
            username: username,
            recordings: savedRecordings
        });

    } catch (error) {
        console.error('Error saving recordings:', error);
        res.status(500).json({ 
            error: 'Failed to save recordings',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`ElevenLabs proxy server running on http://localhost:${PORT}`);
    console.log(`Serving static files from public/`);
    console.log(`Make sure ELEVENLABS_API_KEY is set in .env file`);
});
