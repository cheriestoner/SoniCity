// Record plugin
console.log('recorder.js starting...');

let wavesurfer, record
let scrollingWaveform = false
let continuousWaveform = true

const createWaveSurfer = () => {
    console.log('Creating WaveSurfer instance...')
    
    // Destroy the previous wavesurfer instance
    if (wavesurfer) {
      console.log('Destroying previous instance')
      wavesurfer.destroy()
    }

    // Create a new Wavesurfer instance
    wavesurfer = WaveSurfer.create({
      container: '#mic',
      waveColor: 'rgb(200, 0, 200)',
      progressColor: 'rgb(100, 0, 100)',
      height: 128,
      normalize: true,
      fillParent: true,
    })

    console.log('WaveSurfer instance created:', wavesurfer ? 'success' : 'failed')

    // Initialize the Record plugin
    try {
        record = wavesurfer.registerPlugin(
            WaveSurfer.Record.create({
                renderRecordedAudio: false,
                scrollingWaveform,
                continuousWaveform,
                continuousWaveformDuration: 30,
            }),
        )
        console.log('Record plugin created:', record ? 'success' : 'failed')
    } catch (error) {
        console.error('Error creating Record plugin:', error)
        return
    }

    // Set up event handlers after Record is initialized
    const pauseButton = document.querySelector('#pause')
    const recButton = document.querySelector('#record')
    const micSelect = document.querySelector('#mic-select')

    console.log('Setting up event handlers...')

    // Pause button handler
    pauseButton.onclick = () => {
        console.log('Pause button clicked')
        if (record.isPaused()) {
            record.resumeRecording()
            pauseButton.textContent = 'Pause'
            return
        }

        record.pauseRecording()
        pauseButton.textContent = 'Resume'
    }

    // Record button handler
    recButton.onclick = () => {
        console.log('Record button clicked')
        if (record.isRecording() || record.isPaused()) {
            console.log('Stopping recording')
            record.stopRecording()
            recButton.textContent = 'Record'
            pauseButton.style.display = 'none'
            return
        }

        recButton.disabled = true
        console.log('Starting recording...')

        // get selected device
        const deviceId = micSelect.value
        record.startRecording({ deviceId })
            .then(() => {
                console.log('Recording started successfully')
                recButton.textContent = 'Stop'
                recButton.disabled = false
                pauseButton.style.display = 'inline'
            })
            .catch(error => {
                console.error('Error starting recording:', error)
                recButton.disabled = false
            })
    }

    // Waveform options handlers
    document.querySelector('#scrollingWaveform').onclick = (e) => {
        console.log('Scrolling waveform option changed')
        scrollingWaveform = e.target.checked
        if (continuousWaveform && scrollingWaveform) {
            continuousWaveform = false
            document.querySelector('#continuousWaveform').checked = false
        }
        createWaveSurfer()
    }

    document.querySelector('#continuousWaveform').onclick = (e) => {
        console.log('Continuous waveform option changed')
        continuousWaveform = e.target.checked
        if (continuousWaveform && scrollingWaveform) {
            scrollingWaveform = false
            document.querySelector('#scrollingWaveform').checked = false
        }
        createWaveSurfer()
    }

    // Render recorded audio
    record.on('record-end', (blob) => {
        console.log('Recording ended, creating playback instance')
        const container = document.querySelector('#recordings')
        const recordedUrl = URL.createObjectURL(blob)

        // Create wavesurfer from the recorded audio
        const wavesurfer = WaveSurfer.create({
            container,
            waveColor: 'rgb(200, 100, 0)',
            progressColor: 'rgb(100, 50, 0)',
            url: recordedUrl,
            height: 128,
        })

        // Play button
        const button = container.appendChild(document.createElement('button'))
        button.textContent = 'Play'
        button.onclick = () => wavesurfer.playPause()
        wavesurfer.on('pause', () => (button.textContent = 'Play'))
        wavesurfer.on('play', () => (button.textContent = 'Pause'))

        // Download link
        const link = container.appendChild(document.createElement('a'))
        Object.assign(link, {
            href: recordedUrl,
            download: 'recording.' + blob.type.split(';')[0].split('/')[1] || 'webm',
            textContent: 'Download recording',
        })
    })

    record.on('record-start', () => {
        console.log('Recording started')
    })

    record.on('record-progress', (time) => {
        updateProgress(time)
    })

    pauseButton.style.display = 'none'
    recButton.textContent = 'Record'
    console.log('WaveSurfer setup complete')
}

const progress = document.querySelector('#progress')
const updateProgress = (time) => {
    // time will be in milliseconds, convert it to mm:ss format
    const formattedTime = [
        Math.floor((time % 3600000) / 60000), // minutes
        Math.floor((time % 60000) / 1000), // seconds
    ]
        .map((v) => (v < 10 ? '0' + v : v))
        .join(':')
    progress.textContent = formattedTime
}

// Mic selection
const micSelect = document.querySelector('#mic-select')
console.log('Getting available audio devices...')
WaveSurfer.Record.getAvailableAudioDevices().then((devices) => {
    console.log('Available audio devices:', devices)
    devices.forEach((device) => {
        const option = document.createElement('option')
        option.value = device.deviceId
        option.text = device.label || device.deviceId
        micSelect.appendChild(option)
    })
}).catch(error => {
    console.error('Error getting audio devices:', error)
})

// Wait for everything to be loaded
function initialize() {
    console.log('Checking if WaveSurfer and Record are available...')
    if (typeof WaveSurfer === 'undefined') {
        console.error('WaveSurfer not loaded')
        return
    }
    if (typeof WaveSurfer.Record === 'undefined') {
        console.error('Record plugin not loaded')
        return
    }
    console.log('WaveSurfer and Record plugin are available, initializing...')
    createWaveSurfer()
}

// Try to initialize when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
} else {
    initialize()
}