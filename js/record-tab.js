import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7';
import storage from './storage.js';

// Helper function to get CSS variables
function getCssVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

class RecordTab {
    constructor() {
        this.wavesurfer = null;
        this.record = null;
        this.scrollingWaveform = false;
        this.continuousWaveform = true;
    }

    initialize() {
        this.createWaveSurfer();
        this.setupEventHandlers();
        this.loadRecordings();
    }

    createWaveSurfer() {
        // Create WaveSurfer instance
        this.wavesurfer = WaveSurfer.create({
            container: '#mic',
            waveColor: getCssVariable('--waveform-color'),
            progressColor: getCssVariable('--waveform-progress-color'),
            height: 128,
            barWidth: 2,
            barGap: 3,
            responsive: true,
            normalize: true,
            minPxPerSec: 50,
            fillParent: true,
            plugins: [WaveSurfer.Record.create({
                scrollingWaveform: this.scrollingWaveform,
                continuousWaveform: this.continuousWaveform,
                renderRecordedAudio: false,
                audioBitsPerSecond: 128000,
                desiredSampRate: 16000,
                recorderType: WaveSurfer.Record.MediaRecorder,
                numberOfChannels: 2,
                bufferSize: 4096,
                sampleRate: 44100,
                mimeType: 'audio/webm',
                audioFormat: 'webm',
                timeSlice: 1000,
                ondataavailable: (blob) => {
                    const recording = storage.addRecording(blob);
                    this.createRecordingItem(recording, document.querySelector('#recordings'));
                }
            })]
        });

        // Initialize Record plugin
        this.record = this.wavesurfer.plugins.get('Record');
    }

    setupEventHandlers() {
        const recordButton = document.querySelector('#record');
        const pauseButton = document.querySelector('#pause');
        const scrollingWaveformCheckbox = document.querySelector('#scrollingWaveform');
        const continuousWaveformCheckbox = document.querySelector('#continuousWaveform');
        const progressElement = document.querySelector('#progress');

        // Record button
        recordButton.onclick = () => {
            if (this.record.isRecording()) {
                this.record.stopRecording();
                recordButton.textContent = 'Record';
                pauseButton.style.display = 'none';
            } else {
                this.record.startRecording();
                recordButton.textContent = 'Stop';
                pauseButton.style.display = 'inline-block';
            }
        };

        // Pause button
        pauseButton.onclick = () => {
            if (this.record.isPaused()) {
                this.record.resumeRecording();
                pauseButton.textContent = 'Pause';
            } else {
                this.record.pauseRecording();
                pauseButton.textContent = 'Resume';
            }
        };

        // Scrolling waveform checkbox
        scrollingWaveformCheckbox.onchange = (e) => {
            this.scrollingWaveform = e.target.checked;
            this.record.setScrollingWaveform(this.scrollingWaveform);
        };

        // Continuous waveform checkbox
        continuousWaveformCheckbox.onchange = (e) => {
            this.continuousWaveform = e.target.checked;
            this.record.setContinuousWaveform(this.continuousWaveform);
        };

        // Update progress
        this.wavesurfer.on('audioprocess', () => {
            const currentTime = this.record.getCurrentTime();
            const minutes = Math.floor(currentTime / 60);
            const seconds = Math.floor(currentTime % 60);
            progressElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        });
    }

    loadRecordings() {
        const container = document.querySelector('#recordings');
        const recordings = storage.getRecordings();
        
        recordings.forEach(recording => {
            this.createRecordingItem(recording, container);
        });
    }

    createRecordingItem(recording, container) {
        const item = document.createElement('div');
        item.className = 'recording-item';
        
        // Create waveform
        const wavesurfer = WaveSurfer.create({
            container: item,
            waveColor: getCssVariable('--recording-waveform-color'),
            progressColor: getCssVariable('--recording-progress-color'),
            url: recording.url,
            height: 128,
        });

        // Create controls
        const controls = document.createElement('div');
        controls.className = 'recording-controls';
        
        // Play button
        const playButton = document.createElement('button');
        const playIcon = document.createElement('img');
        playIcon.src = 'playcircle.svg';
        playIcon.alt = 'Play';
        playButton.appendChild(playIcon);
        playButton.onclick = () => wavesurfer.playPause();
        
        // Download button
        const downloadLink = document.createElement('a');
        downloadLink.href = recording.url;
        downloadLink.download = `recording-${recording.id}.webm`;
        downloadLink.className = 'downlink';
        const downloadIcon = document.createElement('img');
        downloadIcon.src = 'arrowdown.svg';
        downloadIcon.alt = 'Download';
        downloadLink.appendChild(downloadIcon);
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        const deleteIcon = document.createElement('img');
        deleteIcon.src = 'trash.svg';
        deleteIcon.alt = 'Delete';
        deleteButton.appendChild(deleteIcon);
        deleteButton.onclick = () => {
            storage.deleteRecording(recording.id);
            item.remove();
        };

        controls.appendChild(playButton);
        controls.appendChild(downloadLink);
        controls.appendChild(deleteButton);
        item.appendChild(controls);
        container.appendChild(item);
    }
}

export default RecordTab; 