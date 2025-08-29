import express from 'express';
import cors from 'cors';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'ElevenLabs proxy server running' });
});

app.listen(PORT, () => {
    console.log(`ElevenLabs proxy server running on http://localhost:${PORT}`);
    console.log(`Serving static files from public/`);
    console.log(`Make sure ELEVENLABS_API_KEY is set in .env file`);
});
