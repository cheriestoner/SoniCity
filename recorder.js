// Record plugin
console.log('recorder.js starting...');

let wavesurfer, record
let scrollingWaveform = false
let continuousWaveform = true

// Function to get CSS variable value
const getCssVariable = (variableName) => {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)
        .trim();
}

const createWaveSurfer = () => {
    console.log('Creating WaveSurfer instance...')
    
    // Destroy the previous wavesurfer instance
    if (wavesurfer) {
      console.log('Destroying previous instance')
      wavesurfer.destroy()
    }

    // Get colors from CSS variables
    const waveColor = getCssVariable('--waveform-color');
    const progressColor = getCssVariable('--waveform-progress-color');

    // Create a new Wavesurfer instance
    wavesurfer = WaveSurfer.create({
      container: '#mic',
      waveColor: waveColor,
      progressColor: progressColor,
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

        // Create recording item container
        const recordingItem = document.createElement('div')
        recordingItem.className = 'recording-item'
        container.appendChild(recordingItem)

        // Get colors from CSS variables for recorded audio
        const recordingWaveColor = getCssVariable('--recording-waveform-color');
        const recordingProgressColor = getCssVariable('--recording-progress-color');

        // Create wavesurfer from the recorded audio
        const wavesurfer = WaveSurfer.create({
            container: recordingItem,
            waveColor: recordingWaveColor,
            progressColor: recordingProgressColor,
            url: recordedUrl,
            height: 128,
        })

        // Create controls container
        const controls = document.createElement('div')
        controls.className = 'recording-controls'
        recordingItem.appendChild(controls)

        // Play button with icon
        const playButton = document.createElement('button')
        const playIcon = document.createElement('img')
        playIcon.src = 'icons/play-circle.svg'
        playIcon.alt = 'Play'
        playButton.appendChild(playIcon)
        playButton.onclick = () => wavesurfer.playPause()
        wavesurfer.on('pause', () => {
            playIcon.src = 'icons/play-circle.svg'
        })
        wavesurfer.on('play', () => {
            playIcon.src = 'icons/pause-circle.svg'
        })
        controls.appendChild(playButton)

        // Download link with icon
        const downloadLink = document.createElement('a')
        downloadLink.href = recordedUrl
        downloadLink.download = 'recording.' + blob.type.split(';')[0].split('/')[1] || 'webm'
        downloadLink.className = 'downlink'
        const downloadIcon = document.createElement('img')
        downloadIcon.src = 'icons/arrowdown.svg'
        downloadIcon.alt = 'Download'
        downloadLink.appendChild(downloadIcon)
        controls.appendChild(downloadLink)

        // Delete button with icon
        const deleteButton = document.createElement('button')
        const deleteIcon = document.createElement('img')
        deleteIcon.src = 'icons/trash.svg'
        deleteIcon.alt = 'Delete'
        deleteButton.appendChild(deleteIcon)
        deleteButton.onclick = () => {
            URL.revokeObjectURL(recordedUrl)  // Clean up the URL object
            wavesurfer.destroy()  // Destroy wavesurfer instance
            recordingItem.remove()  // Remove the recording item from DOM
        }
        controls.appendChild(deleteButton)
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