class AudioRecorder {
    constructor() {
        this.audioContext = null;
        this.mediaRecorder = null;
        this.isRecording = false;
        this.audioChunks = [];
        this.analyser = null;
        this.visualizer = document.getElementById('visualizer');
        this.visualizerCtx = this.visualizer.getContext('2d');
        this.recordButton = document.getElementById('recordButton');
        this.downloadButton = document.getElementById('downloadButton');
        this.lastRecording = null;
        this.lastRecordingName = null;
        
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        // Set canvas size with device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = this.visualizer.getBoundingClientRect();
        
        this.visualizer.width = rect.width * dpr;
        this.visualizer.height = rect.height * dpr;
        this.visualizerCtx.scale(dpr, dpr);
        
        // Set CSS size
        this.visualizer.style.width = `${rect.width}px`;
        this.visualizer.style.height = `${rect.height}px`;
    }

    setupEventListeners() {
        this.recordButton.addEventListener('click', () => this.toggleRecording());
        this.downloadButton.addEventListener('click', () => this.downloadRecording());
        window.addEventListener('resize', () => this.setupCanvas());
    }

    async initializeAudio() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyzer node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            // Connect microphone to analyzer
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            
            // Setup media recorder
            this.mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.lastRecording = URL.createObjectURL(audioBlob);
                this.lastRecordingName = `recording-${new Date().toISOString()}.wav`;
                this.audioChunks = [];
                this.downloadButton.style.display = 'flex';
            };
            
            this.startVisualization();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
        }
    }

    startVisualization() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const barWidth = this.visualizer.width / bufferLength;
        
        const draw = () => {
            if (!this.analyser) return;
            
            requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(dataArray);
            
            this.visualizerCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.visualizerCtx.fillRect(0, 0, this.visualizer.width, this.visualizer.height);
            
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * this.visualizer.height;
                
                const hue = (i / bufferLength) * 360;
                this.visualizerCtx.fillStyle = `hsl(${hue}, 70%, 60%)`;
                
                this.visualizerCtx.fillRect(
                    i * barWidth,
                    this.visualizer.height - barHeight,
                    barWidth - 1,
                    barHeight
                );
            }
        };
        
        draw();
    }

    async toggleRecording() {
        if (!this.audioContext) {
            await this.initializeAudio();
        }

        if (!this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    startRecording() {
        this.mediaRecorder.start();
        this.isRecording = true;
        this.recordButton.classList.add('recording');
        this.downloadButton.style.display = 'none';
    }

    stopRecording() {
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.recordButton.classList.remove('recording');
    }

    downloadRecording() {
        if (!this.lastRecording || !this.lastRecordingName) return;
        
        const downloadLink = document.createElement('a');
        downloadLink.href = this.lastRecording;
        downloadLink.download = this.lastRecordingName;
        downloadLink.click();
    }
}

// Initialize the audio recorder when the page loads
window.addEventListener('load', () => {
    new AudioRecorder();
}); 